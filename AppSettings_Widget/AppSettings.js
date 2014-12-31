define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/dom-construct',
    'dojo/topic',
    'dojo/on',
    'dojo/_base/array',
    'dojo/json',
    'dojo/_base/lang',
    'dijit/form/Button',
    'esri/geometry/Extent',
    'dijit/registry',
    'dojo/ready',
    'dojo/text!./AppSettings/templates/AppSettings.html',
    'dijit/Menu',
    'dijit/MenuItem',
    'dijit/PopupMenuItem',
    'dijit/form/CheckBox',
    'dijit/Dialog',
    'dijit/Toolbar'
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
        DomConstruct, Topic, On, Array, Json, Lang, Button, Extent, registry, ready,
        appSettingsTemplate, Menu, MenuItem, PopupMenuItem, Checkbox, Dialog) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        /* params */
        /**
         * each app setting may have the following properties:
         * save - whether or not to save this setting
         * value: the currently saved value
         * checkbox: whether or not to display a user checkbox
         * label: a checkbox label
         * urlLoad: whether or not a value has been loaded via url
         */
        appSettings: {},
        //email settings
        shareNode: null,
        shareTemplate: '<a href="#"><i class="fa fa-fw fa-envelope-o"></i>Share Map</a>',
        /* settings to share via email */
        emailSettings: ['saveMapExtent', 'saveLayerVisibility'],
        address: '',
        subject: 'Share Map',
        body: '',
        /* private */
        widgetsInTemplate: true,
        templateString: appSettingsTemplate,
        _defaultAppSettings: {
            saveMapExtent: {
                save: false,
                value: {},
                checkbox: true,
                label: 'Save Map Extent',
                urlLoad: false
            },
            saveLayerVisibility: {
                save: false,
                value: {},
                checkbox: true,
                label: 'Save Layer Visibility',
                urlLoad: false
            }
        },
        _appSettings: null,
        layerHandles: null,
        constructor: function () {
            this.inherited(arguments);
            this.layerHandles = [];
        },
        postCreate: function () {
            this.inherited(arguments);
            Lang.mixin(this._defaultAppSettings, this.appSettings);
            if (!this.map || !this.layerInfos) {
                this._disable();
                this._error('AppSettings requires map and layerInfos objects');
            } else {
                this._init();
            }
        },
        _init: function () {
            this._loadAppSettings();
            this._handleShare();

            On(this.clearCacheButton, 'click', Lang.hitch(this, function () {
                for (var s in this._defaultAppSettings) {
                    if (this._defaultAppSettings.hasOwnProperty(s)) {
                        if (this._appSettings.hasOwnProperty(s)) {
                            Lang.mixin(this._appSettings[s], this._defaultAppSettings[s]);
                        } else {
                            this._appSettings[s] = this._defaultAppSettings[s];
                        }

                    }
                }
                this._saveAppSettings();
                this._refreshView();
            }));

            this._setCheckboxHandles();

            ready(1, this, '_loadSavedExtent');
            ready(1, this, '_loadSavedLayers');
            ready(2, this, '_setHandles');
            ready(3, this, '_handleTopics');
        },
        _loadAppSettings: function () {
            //start with default
            this._appSettings = Lang.clone(this._defaultAppSettings);
            //mixin local storage
            if (localStorage.CMV_appSettings) {
                try {
                    var loadedSettings = Json.parse(localStorage.getItem('CMV_appSettings'));
                    for (var setting in loadedSettings) {
                        if (loadedSettings.hasOwnProperty(setting) &&
                                loadedSettings[setting].save) {
                            if (!this._appSettings.hasOwnProperty(setting)) {
                                this._appSettings[setting] = loadedSettings[setting];
                            } else {
                                Lang.mixin(this._appSettings[setting], loadedSettings[setting]);
                            }
                        }
                    }
                } catch (error) {
                    this._error('_loadLocalStorage: ' + error);
                }
            }
            //url parameters override 
            var parameters = decodeURI(window.location.search);
            if (parameters.indexOf('CMV_appSettings') !== -1) {
                try {
                    if (parameters.indexOf('&') !== -1) {
                        parameters = parameters.split('&');
                    } else {
                        parameters = [parameters];
                    }
                    for (var i in parameters) {
                        if (parameters[i].indexOf('CMV_appSettings') !== -1) {
                            var settings = Json.parse(decodeURIComponent(parameters[i].split('=')[1]));
                            //don't override this users preferences, just the values
                            for (var s in settings) {
                                if (settings.hasOwnProperty(s) && this._appSettings.hasOwnProperty(s)) {
                                    this._appSettings[s].value = settings[s];
                                    //set urlLoad flag override
                                    this._appSettings[s].urlLoad = true;
                                }
                            }
                        }
                    }
                } catch (error) {
                    this._error('_loadURLParameters' + error);
                }
            }
        },
        _setCheckboxHandles: function () {
            for (var setting in this._appSettings) {
                if (this._appSettings.hasOwnProperty(setting) && this._appSettings[setting].checkbox) {
                    this._addCheckbox(setting);
                }
            }
        },
        _addCheckbox: function (setting) {
            var li = DomConstruct.create('li', null, this.settingsList);
            this._appSettings[setting]._checkboxNode = new Checkbox({
                id: setting,
                checked: this._appSettings[setting].save,
                onChange: Lang.hitch(this, function (setting) {
                    return function (checked) {
                        this._appSettings[setting].save = checked;
                        this._saveAppSettings();
                    }
                }(setting))
            });
            this._appSettings[setting]._checkboxNode.placeAt(li);

            DomConstruct.create('label', {
                innerHTML: this._appSettings[setting].label,
                'for': setting
            }, li);
        },
        _handleTopics: function () {
            this.own(Topic.subscribe('AppSettings/setValue', Lang.hitch(this, function (key, value) {
                this._setValue(key, value);
            })));
            Topic.publish('AppSettings/onSettingsLoad', Lang.clone(this._appSettings));
        },
        _addRightClickMenu: function () {
            this.menu = new Menu();
            this.mapRightClickMenu.addChild(new MenuItem({
                label: 'Share Map',
                onClick: Lang.hitch(this, '_emailLink')
            }));
        },
        /*
         * used to modify settings programatically (without checkboxes)
         * @param {type} key string to identify setting to set
         * @param {object} value value to mixin as setting
         * @returns {undefined}
         */
        _setValue: function (key, settingsObj) {
            if (this._appSettings.hasOwnProperty(key)) {
                Lang.mixin(this._appSettings[key], settingsObj);
            } else {
                this._appSettings[key] = settingsObj;
            }
            this._saveAppSettings();
            this._refreshView();
        },
        /**
         * saves the current value of this._appSettings to localStorage
         */
        _saveAppSettings: function () {
            localStorage.setItem('CMV_appSettings', this._settingsToJSON());
        },
        /**
         * returns a simplified _appSettings object encoded in JSON
         * @returns {object <settings>} simplified settings object
         */
        _settingsToJSON: function (settings) {
            if (!settings) {
                settings = {};
            }
            for (var setting in this._appSettings) {
                if (this._appSettings.hasOwnProperty(setting)) {
                    settings[setting] = {
                        save: this._appSettings[setting].save,
                        value: Lang.clone(this._appSettings[setting].value)
                    }
                }
            }
            return Json.stringify(settings);
        },
        _loadSavedExtent: function () {
            //load map extent
            if (this._appSettings.saveMapExtent.save ||
                    this._appSettings.saveMapExtent.urlLoad) {
                this.map.centerAndZoom(
                        this._appSettings.saveMapExtent.value.center,
                        this._appSettings.saveMapExtent.value.zoom
                        );

                //reset url flag
                this._appSettings.saveMapExtent.urlLoad = false;
            }
        },
        _loadSavedLayers: function () {
            var setting = this._appSettings.saveLayerVisibility;
            //load visible layers
            if (setting.save || setting.urlLoad) {
                Array.forEach(this.layerInfos, Lang.hitch(this, function (layer) {
                    if (setting.value.hasOwnProperty(layer.layer.id)) {
                        if (setting.value[layer.layer.id].visibleLayers) {
                            layer.layer.setVisibleLayers(setting.value[layer.layer.id].visibleLayers);
                            Topic.publish('layerControl/setVisibleLayers', {
                                id: layer.layer.id,
                                visibleLayers: setting.value[layer.layer.id]
                                        .visibleLayers
                            });
                        }
                        if (setting.value[layer.layer.id].visible !== null) {
                            layer.layer.setVisibility(setting.value[layer.layer.id].visible);
                        }
                    }
                }));
                //reset url flag
                setting.urlLoad = false;
            }
        },
        /*
         * a helper function to manage event handlers
         */
        _setHandles: function () {
            //map extent handles
            this._setExtentHandles();

            //layer visibility handles
            this._setLayerVisibilityHandles();
        },
        _setExtentHandles: function () {
            this._appSettings.saveMapExtent.value = {};
            this._appSettings.saveMapExtent.value.center = this.map.extent.getCenter();
            this._appSettings.saveMapExtent.value.zoom = this.map.getZoom();
            this.own(this.map.on('zoom-end', Lang.hitch(this, function (event) {
                this._appSettings.saveMapExtent.value.zoom = event.level;
                this._saveAppSettings();
            })));
            this.own(this.map.on('pan-end', Lang.hitch(this, function (event) {
                this._appSettings.saveMapExtent.value.center = event.extent.getCenter();
                this._saveAppSettings();
            })));
        },
        _setLayerVisibilityHandles: function () {
            var setting = this._appSettings.saveLayerVisibility;
            setting.value = {};
            Array.forEach(this.layerInfos, Lang.hitch(this, function (layer) {
                var id = layer.layer.id;
                var visibleLayers;
                if (layer.layer.hasOwnProperty('visibleLayers')) {
                    visibleLayers = [];
                    Array.forEach(layer.layer.visibleLayers, function (subLayerId) {
                        if (subLayerId !== -1 &&
                                layer.layer.hasOwnProperty('layerInfos') &&
                                layer.layer.layerInfos[subLayerId].subLayerIds === null) {
                            visibleLayers.push(subLayerId);
                        }
                    });
                    if (visibleLayers.length === 0) {
                        visibleLayers.push(-1);
                    }
                }
                setting.value[id] = {
                    visible: layer.layer.visible,
                    visibleLayers: visibleLayers
                };
            }));
            this.own(Topic.subscribe('layerControl/setVisibleLayers', Lang.hitch(this, function (layer) {
                setting.value[layer.id].visibleLayers = layer.visibleLayers;
                this._saveAppSettings();
            })));
            this.own(Topic.subscribe('layerControl/layerToggle', Lang.hitch(this, function (layer) {
                setting.value[layer.id].visible = layer.visible;
                this._saveAppSettings();
            })));
        },
        _settingsToURL: function (settings) {
            var queryString;
            if (window.location.search !== '') {
                if (window.location.search.indexOf('CMV_appSettings') !== -1 &&
                        window.location.search.split('CMV_appSettings')[0].length > 1) {
                    queryString = window.location.search.split('CMV_appSettings')[0] + '&';
                } else {
                    queryString = '?';
                }
            } else {
                queryString = '?';
            }
            return [window.location.protocol + '//',
                window.location.host,
                window.location.pathname,
                queryString + 'CMV_appSettings=',
                encodeURIComponent(Json.stringify(settings))].join('');
        },
        _emailLink: function () {
            var settings = {};
            Array.forEach(this.emailSettings, Lang.hitch(this, function (setting) {
                if (this._appSettings.hasOwnProperty(setting)) {
                    settings[setting] = this._appSettings[setting].value;
                }
            }));
            var link = this._settingsToURL(settings);
            try {
                window.open('mailto:' + this.address + '?subject=' + this.subject +
                        '&body=' + this.body + ' ' + link, '_self');
            } catch (e) {
                this._error('_emailLink: ' + e);
            }
            myDialog = new Dialog({
                title: "Share Map",
                content: ['<p>Right click the link below and choose Copy Link or Copy Shortcut:</p>',
                    '<p><a href="', link, '">Share this map</a></p>'].join(''),
                style: "width: 300px; overflow:hidden;"
            }).show();
        },
        _handleShare: function () {
            //place share button/link
            if (this.shareNode !== null) {
                var share = DomConstruct.place(this.shareTemplate, this.shareNode);
                On(share, 'click', Lang.hitch(this, '_emailLink'));
            }

            On(this.defaultShareButton, 'click', Lang.hitch(this, '_emailLink'));

            if (this.mapRightClickMenu) {
                this._addRightClickMenu();
            }
        },
        _refreshView: function () {
            for (var setting in this._appSettings) {
                if (this._appSettings.hasOwnProperty(setting) &&
                        this._appSettings[setting].checkbox) {
                    this._appSettings[setting]._checkboxNode.set('checked', this._appSettings[setting].save);
                }
            }
        },
        /*
         * disables this widget ui
         */
        _disable: function () {
//            for (var setting in this._appSettings) {
//                if (this.hasOwnProperty(setting)) {
//                    this[setting].set('disabled', 'disabled');
//                }
//            }
        },
        /*
         * a helper error logging function
         */
        _error: function (e) {
            //if an error occurs local storage corruption
            // is probably the issue
            Topic.publish('viewer/handleError', {
                source: 'AppSettings',
                error: e
            });
            localStorage.clear();
            Lang.mixin(this._appSettings, this._defaultAppSettings);
        }

    });
});