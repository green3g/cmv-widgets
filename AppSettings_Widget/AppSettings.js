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
    'dijit/form/CheckBox'
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
        DomConstruct, Topic, On, Array, Json, Lang, Button, Extent, registry, ready,
        appSettingsTemplate, Menu, MenuItem) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        /* params */
        defaultAppSettings: {
            saveMapExtent: {
                save: false,
                urlLoad: false,
                value: null
            },
            saveLayerVisibility: {
                save: false,
                urlLoad: false,
                value: null
            }
        },
        //email settings
        shareNode: null,
        shareTemplate: '<a href="#"><i class="fa fa-fw fa-envelope-o"></i>Share Map</a>',
        emailSettings: ['saveMapExtent', 'saveLayerVisibility'],
        address: '',
        subject: 'Share Map',
        body: '',
        /* private */
        widgetsInTemplate: true,
        templateString: appSettingsTemplate,
        _appSettings: null,
        //layer handles
        layerHandles: null,
        checkboxHandles: null,
        constructor: function () {
            this._appSettings = Lang.clone(this.defaultAppSettings);
            this._loadLocalStorage();
            var parameters = decodeURI(window.location.search);
            if (parameters.indexOf('CMV_appSettings') !== -1) {
                this._loadURLParameters(parameters);
            }
            //if no localstorage capabilities exist, disable this widget
            if (!window.localStorage) {
                this._disable();
            }

            this.layerHandles = [];
            this.checkboxHandles = {};
        },
        postCreate: function () {
            this.inherited(arguments);
            if (!this.map || !this.layerInfos) {
                this._disable();
                this._error('AppSettings requires map and layerInfos objects');
            } else {
                ready(1, this, '_loadSavedExtent');
                ready(1, this, '_loadSavedLayers');
                ready(2, this, '_setHandles');

                this._setCheckboxHandles();
                this._handleTopics();
                On(this.clearCacheButton, 'click', Lang.hitch(this, function () {
                    this._appSettings = this.defaultAppSettings;
                    this._saveAppSettings();
                    this._refreshView();
                }));
                this._handleShare();
            }
        },
        _setCheckboxHandles: function () {
            for (var setting in this._appSettings) {
                if (this.hasOwnProperty(setting)) {
                    this.checkboxHandles[setting] =
                            On(this[setting], 'change', Lang.hitch(this, function (setting) {
                                return function (checked) {
                                    this._setValue(setting, {
                                        save: checked
                                    });
                                };
                            }(setting)));
                }
            }
        },
        _handleTopics: function () {
            Topic.publish('AppSettings/onSettingsLoad', Lang.clone(this._appSettings));
            Topic.subscribe('AppSettings/setValue', Lang.hitch(this, function (key, value) {
                this._setValue(key, value);
            }));
        },
        _addRightClickMenu: function () {
            this.menu = new Menu();
            this.mapRightClickMenu.addChild(new MenuItem({
                label: 'Share Map',
                onClick: Lang.hitch(this, '_emailLink')
            }));
        },
        /*
         *
         * @param {type} key string to identify setting to set
         * @param {object} value value to set as setting
         * @returns {undefined}
         */
        _setValue: function (key, value) {
            this._appSettings[key] = value;
            this._setHandles();
            this._saveAppSettings();
            this._refreshView();
        },
        /*
         * sets the current value of this._appSettings to localStorage
         * 
         */
        _saveAppSettings: function () {
            var settingsString = Json.stringify(this._appSettings);
            localStorage.setItem('CMV_appSettings', settingsString);
        },
        /*
         * check for saved settings in url
         */
        _loadURLParameters: function (parameters) {
            try {
                if (parameters.indexOf('&') !== -1) {
                    parameters = parameters.split('&');
                } else {
                    parameters = [parameters];
                }
                for (var i in parameters) {
                    if (parameters[i].indexOf('CMV_appSettings') !== -1) {
                        var settings = Json.parse(parameters[i].split('=')[1]);
                        //don't override this users preferences, just the values
                        for (var j in settings) {
                            if (settings.hasOwnProperty(j) && this._appSettings.hasOwnProperty(j)) {
                                this._appSettings[j].value = settings[j].value;
                                this._appSettings[j].urlLoad = true;
                            }
                        }
                    }
                }
            } catch (error) {
                this._error('_loadURLParameters' + error);
            }
        },
        /*
         * check for saved settings in local storage
         */
        _loadLocalStorage: function () {
            if (localStorage.CMV_appSettings) {
                try {
                    var CMV_appSettings = localStorage.getItem('CMV_appSettings');
                    this._appSettings = Json.parse(CMV_appSettings);
                } catch (error) {
                    this._error('_loadLocalStorage: ' + error);
                }
            }
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
            if (this._appSettings.saveMapExtent.save) {
                this._setExtentHandles();
            } else {
                this._removeExtentHandles();
            }

            //layer visibility handles
            if (this._appSettings.saveLayerVisibility.save) {
                this._setLayerVisibilityHandles();
            } else {
                this._removeLayerVisibilityHandles();
            }
        },
        _setExtentHandles: function () {
            this._appSettings.saveMapExtent.value = {};
            this._appSettings.saveMapExtent.value.center = this.map.extent.getCenter();
            this._appSettings.saveMapExtent.value.zoom = this.map.getZoom();
            if (!this.mapZoomHandle) {
                this.mapZoomHandle = this.map.on('zoom-end', Lang.hitch(this, function (event) {
                    this._appSettings.saveMapExtent.value.zoom = event.level;
                    this._saveAppSettings();
                }));
            }
            if (!this.mapPanHandle) {
                this.mapPanHandle = this.map.on('pan-end', Lang.hitch(this, function (event) {
                    this._appSettings.saveMapExtent.value.center = event.extent.getCenter();
                    this._saveAppSettings();
                }));
            }
        },
        _removeExtentHandles: function () {
            this._appSettings.saveMapExtent.value = null;
            if (this.mapZoomHandle) {
                this.mapZoomHandle.remove();
                this.mapZoomHandle = null;
            }
            if (this.mapPanHandle) {
                this.mapPanHandle.remove();
                this.mapPanHandle = null;
            }
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
            this.layerHandles = {
                setVisibleLayers: Topic.subscribe('layerControl/setVisibleLayers', Lang.hitch(this, function (layer) {
                    setting.value[layer.id].visibleLayers = layer.visibleLayers;
                    this._saveAppSettings();
                })),
                layerToggle: Topic.subscribe('layerControl/layerToggle', Lang.hitch(this, function (layer) {
                    setting.value[layer.id].visible = layer.visible;
                    this._saveAppSettings();
                }))
            };
        },
        _removeLayerVisibilityHandles: function () {
            this._appSettings.saveLayerVisibility = {
                save: false
            };
            if (this.layerHandles.setVisibleLayers) {
                this.layerHandles.setVisibleLayers.remove();
            }
            if (this.layerHandles.layerToggle) {
                this.layerHandles.layerToggle.remove();
            }
            this._saveAppSettings();
        },
        _emailLink: function () {
            var currentSettings = Lang.clone(this._appSettings);
            Array.forEach(this.emailSettings, Lang.hitch(this, function (setting) {
                this._setValue(setting, {
                    save: true
                });
            }));
            var queryString = window.location.search !== '' ? window.location.search + '&' : '?';
            var link = window.location.protocol + '//' +
                    window.location.host +
                    window.location.pathname +
                    encodeURIComponent(queryString + 'CMV_appSettings=' + Json.stringify(this._appSettings));
            console.log(link)
            window.open('mailto:' + this.address + '?subject=' + this.subject +
                    '&body=' + this.body + ' ' + link, '_self');
            Array.forEach(this.emailSettings, Lang.hitch(this, function (setting) {
                this._setValue(setting, {
                    save: currentSettings[setting].save
                });
            }));
        },
        _handleShare: function () {
            //place share button/link
            var share;
            if (this.shareNode !== null) {
                share = DomConstruct.place(this.shareTemplate, this.shareNode);
            } else {
                share = new Button({
                    iconClass: 'fa fa-envelope-o fa-fw',
                    showLabel: true,
                    label: 'Email Map'
                }, this.defaultShareNode);
            }
            On(share, 'click', Lang.hitch(this, '_emailLink'));
            if (this.mapRightClickMenu) {
                this._addRightClickMenu();
            }
        },
        _refreshView: function () {
            for (var setting in this._appSettings) {
                if (this.hasOwnProperty(setting)) {
                    this[setting].set('checked', this._appSettings[setting].save);
                }
            }
        },
        /*
         * disables this widget ui
         */
        _disable: function () {
            for (var setting in this._appSettings) {
                if (this.hasOwnProperty(setting)) {
                    this[setting].set('disabled', 'disabled');
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
            this._appSettings = Lang.clone(this.defaultAppSettings);
        }

    });
});
