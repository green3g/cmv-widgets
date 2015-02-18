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
    'dojo/ready',
    'dijit/Menu',
    'dijit/MenuItem',
    'dijit/form/CheckBox',
    'dijit/Dialog',
    'dojo/text!./AppSettings/templates/AppSettings.html',
    'dijit/form/Button',
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
        DomConstruct, Topic, On, Array, Json, Lang, ready,
        Menu, MenuItem, Checkbox, Dialog, appSettingsTemplate) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        /* params */
        /**
         * each app setting may have the following properties:
         * save - boolean, whether or not to save this setting
         * value: object, the currently saved value
         * checkbox: boolean, whether or not to display a user checkbox
         * label: string, a checkbox label
         * urlLoad: whether or not a value has been loaded via url - this is set by this widget
         */
        appSettings: {},
        parameterName: 'cmvSettings',
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
        layerHandles: [],
        postCreate: function () {
            this.inherited(arguments);
            //mix in additional default settings
            Lang.mixin(this._defaultAppSettings, this.appSettings);
            if (!this.map || !this.layerInfos) {
                this._error('AppSettings requires map and layerInfos objects');
                return;
            } else {
                this._init();
            }
        },
        _init: function () {
            this._loadAppSettings();
            this._handleShare();
            this._setCheckboxHandles();

            ready(1, this, '_loadSavedExtent');
            ready(1, this, '_loadSavedLayers');
            ready(2, this, '_setHandles');
            ready(3, this, '_handleTopics');
        },
        /**
         * loads the settings from localStorage and overrides the loaded settings
         * with values in the url parameters
         */
        _loadAppSettings: function () {
            //start with default
            this._appSettings = Lang.clone(this._defaultAppSettings);
            //mixin local storage
            if (localStorage[this.parameterName]) {
                //this may fail if Json is invalid
                try {
                    //parse the settings
                    var loadedSettings = Json.parse(localStorage.getItem(this.parameterName));
                    //store each setting that was loaded
                    //override the default
                    for (var setting in loadedSettings) {
                        if (loadedSettings.hasOwnProperty(setting) &&
                                loadedSettings[setting].save) {
                            if (!this._appSettings.hasOwnProperty(setting)) {
                                //if the property is not in the default settings, create it
                                this._appSettings[setting] = loadedSettings[setting];
                            } else {
                                //otherwise mixin the setting
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
            if (parameters.indexOf(this.parameterName) !== -1) {
                //this can also throw errors if the json is invalid
                try {
                    if (parameters.indexOf('&') !== -1) {
                        parameters = parameters.split('&');
                    } else {
                        parameters = [parameters];
                    }
                    for (var i in parameters) {
                        if (parameters[i].indexOf(this.parameterName) !== -1) {
                            var settings = Json.parse(decodeURIComponent(parameters[i].split('=')[1]));
                            for (var s in settings) {
                                if (settings.hasOwnProperty(s) && this._appSettings.hasOwnProperty(s)) {
                                    this._appSettings[s].value = settings[s];
                                    //set urlLoad flag override
                                    //this tells the widget that the settings were loaded via 
                                    //url and should be loaded regardless of the user's checkbox
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
        /**
         * if the checkbox property is set to true, calls the _addCheckbox function
         */ 
        _setCheckboxHandles: function () {
            for (var setting in this._appSettings) {
                if (this._appSettings.hasOwnProperty(setting) && this._appSettings[setting].checkbox) {
                    this._addCheckbox(setting);
                }
            }
        },
        /**
         * creates a checkbox and sets the event handlers
         */
        _addCheckbox: function (setting) {
            var li = DomConstruct.create('li', null, this.settingsList);
            this._appSettings[setting]._checkboxNode = new Checkbox({
                id: setting,
                checked: this._appSettings[setting].save,
                onChange: Lang.hitch(this, function (setting) {
                    return function (checked) {
                        //optional, publish a google analytics event
                        Topic.publish('googleAnalytics/events', {
                            category: 'AppSettings',
                            action: 'checkbox',
                            label: setting,
                            value: checked ? 1 : 0
                        });
                        this._appSettings[setting].save = checked;
                        this._saveAppSettings();
                    };
                }(setting))
            });
            this._appSettings[setting]._checkboxNode.placeAt(li);

            DomConstruct.create('label', {
                innerHTML: this._appSettings[setting].label,
                'for': setting
            }, li);
        },
        /**
         * publishes and subscribes to the AppSettings topics
         */
        _handleTopics: function () {
            this.own(Topic.subscribe('AppSettings/setValue', Lang.hitch(this, function (key, value) {
                this._setValue(key, value);
            })));
            Topic.publish('AppSettings/onSettingsLoad', Lang.clone(this._appSettings));
        },
        /**
         * creates the right click map menu
         */
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
            localStorage.setItem(this.parameterName, this._settingsToJSON());
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
                    };
                }
            }
            return Json.stringify(settings);
        },
        /**
         * recovers the saved extent from the _appSettings object
         * if the settings's save or urlLoad property is true
         */
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
        /**
         * sets the visibility of the loaded layers if save or urlLoad is true
         */
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
        /**
         * sets the extent and layer visibility handles
         */
        _setHandles: function () {
            //map extent handles
            this._setExtentHandles();

            //layer visibility handles
            this._setLayerVisibilityHandles();
        },
        _setExtentHandles: function () {
            this._appSettings.saveMapExtent.value = {};
            this.own(this.map.on('extent-change', Lang.hitch(this, function (event) {
                this._appSettings.saveMapExtent.value.center = this.map.extent.getCenter();
                this._appSettings.saveMapExtent.value.zoom = this.map.getZoom();
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
        /**
         * creates a share url form the settings
         * @param {object} settings - the settings to generate a url from
         * @returns {string} url
         */
        _settingsToURL: function (settings) {
            var queryString;
            //if the current url has query parameters, remove the appSettings property if it exists
            //and try to preserve the rest of it. 
            if (window.location.search !== '') {
                if (window.location.search.indexOf(this.parameterName) !== -1 ) {
                    //the appSettings parameter will always be the last, so preserve anything before it
                    queryString = window.location.search.split(this.parameterName)[0] + '&';
                } else {
                    queryString = window.location.search;
                }
            } else {
                queryString = '?';
            }
            //build url using window.location
            return [window.location.protocol + '//',
                window.location.host,
                window.location.pathname,
                queryString + this.parameterName + '=',
                encodeURIComponent(Json.stringify(settings))].join('');
        },
        /**
         * in case something goes wrong, the settings are reset.
         * the user has the option to reset without manually clearing their cache
         */
        _clearCache: function () {
            for (var s in this._defaultAppSettings) {
                if (this._defaultAppSettings.hasOwnProperty(s)) {
                    if (this._appSettings.hasOwnProperty(s)) {
                        Lang.mixin(this._appSettings[s], this._defaultAppSettings[s]);
                    } else {
                        this._appSettings[s] = Lang.clone(this._defaultAppSettings[s]);
                    }
                }
            }
            this._saveAppSettings();
            this._refreshView();
        },
        /**
         * handles the opening of a new email and displays a temporary dialog
         * in case the email fails to open
         */
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
            new Dialog({
                title: "Share Map",
                content: ['<p>Right click the link below and choose Copy Link or Copy Shortcut:</p>',
                    '<p><a href="', link, '">Share this map</a></p>'].join(''),
                style: "width: 300px; overflow:hidden;",
                onHide: function() {
                    this.destroyRecursive();
                }
            }).show();
            //optional google analytics event
            Topic.publish('googleAnalytics/events', {
                category: 'AppSettings',
                action: 'map-share'
            });
        },
        /**
         * creates the domnode for the share button
         */
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
        /**
         * in case something changes programatically, this can be called to update
         * the checkboxes
         */
        _refreshView: function () {
            for (var setting in this._appSettings) {
                if (this._appSettings.hasOwnProperty(setting) &&
                        this._appSettings[setting].checkbox) {
                    this._appSettings[setting]._checkboxNode.set('checked',
                            this._appSettings[setting].save);
                }
            }
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
