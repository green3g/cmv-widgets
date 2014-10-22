/**
 * 
 * Dijit Title: AppSettings
 * Description: A dijit that allows the user to save 
 * the current state of the map extent and visible layers via localStorage
 * and URL
 * Documentation: https://github.com/roemhildtg/CMV_Widgets/tree/master/AppSettings_Widget
 * 
 * Copyright (C) 2014 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
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
    'dijit/form/CheckBox',
    'dijit/form/Button',
    'esri/geometry/Extent',
    'dojo/text!./AppSettings/templates/AppSettings.html',
    'dijit/Menu',
    'dijit/MenuItem',
    'dijit/PopupMenuItem'
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
        DomConstruct, Topic, On, Array, Json, Lang, Checkbox, Button, Extent,
        appSettingsTemplate, Menu, MenuItem, PopupMenuItem) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        //email settings
        shareNode: null,
        shareTemplate: '<a href="#">Share Map</a>',
        emailSettings: ['saveMapExtent', 'saveLayerVisibility', 'storeURL'],
        address: '',
        subject: 'Share Map',
        body: '',
        defaultAppSettings: {
            saveMapExtent: {
                save: false
            },
            saveLayerVisibility: {
                save: false
            },
            storeURL: {
                save: false
            }
        },
        templateString: appSettingsTemplate,
        _appSettings: null,
        layerHandles: null,
        checkboxHandles: null,
        constructor: function () {
            this._appSettings = Lang.clone(this.defaultAppSettings);
            var parameters = decodeURI(window.location.hash);
            if (parameters.indexOf('CMV_appSettings') !== -1) {
                this._loadHashParameters(parameters);
            } else if (window.localStorage) {
                this._loadLocalStorage();
            }
            //if no localstorage capabilities exist, disable this widget
            if (!window.localStorage) {
                this._disable();
            }
        },
        postCreate: function () {
            this.inherited(arguments);
            this.layerHandles = [];
            this.checkboxHandles = {};
            if (!this.map || !this.layerInfos) {
                this._disable();
                this._error('AppSettings requires map and tocLayerInfos');
            } else {
                this._loadAppSettings();
                this._setHandles();
                for (var setting in this._appSettings) {
                    if (this.hasOwnProperty(setting)) {
                        this.checkboxHandles[setting] =
                                On(this[setting], 'change', Lang.hitch(this, function (setting) {
                                    return function (checked) {
                                        this._setValue(setting, { save: checked });
                                    };
                                }(setting)));
                    }
                }

                On(this.clearCacheButton, 'click', Lang.hitch(this, function () {
                    this._appSettings = this.defaultAppSettings;
                    this._saveAppSettings();
                    this._refreshView();
                }));
                var share;
                if (this.shareNode !== null) {
                    share = DomConstruct.place(this.shareTemplate, this.shareNode);
                } else {
                    share = new Button({
                        iconClass: 'dijitIconMail',
                        showLabel: true,
                        label: 'Email Map'
                    }, this.defaultShareNode);
                }
                On(share, 'click', Lang.hitch(this, function () {
                    this._emailLink();
                }));
                if (this.mapRightClickMenu) {
                    this._addRightClickMenu();
                }
            }
        },
        _addRightClickMenu: function () {
            this.menu = new Menu();
            this.mapRightClickMenu.addChild(new MenuItem({
                label: 'Share Map',
                onClick: Lang.hitch(this, '_emailLink')
            }));
        },
        _emailLink: function () {
            //enable required settings for email
            var currentSettings = Lang.clone(this._appSettings);
            Array.forEach(this.emailSettings, Lang.hitch(this, function (setting) {
                this._setValue(setting, {save: true});
            }));
            var link = encodeURIComponent(window.location + '\r\n\r\n');
            window.open('mailto:' + this.address + '?subject=' + this.subject +
                    '&body=' + this.body + '\n\n' + link, '_self');
            //this._appSettings = currentSettings;
            //set values back to original
            Array.forEach(this.emailSettings, Lang.hitch(this, function (setting) {
                this._setValue(setting, {save: currentSettings[setting].save });
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
         * and url hash if storeURL is true
         */
        _saveAppSettings: function () {
            var settingsString = Json.stringify(this._appSettings);
            localStorage.setItem('CMV_appSettings', settingsString);

            //setup store url
            if (this._appSettings.storeURL.save) {
                var storeURL = encodeURI('CMV_appSettings=' + settingsString);
                window.location.hash = storeURL;
            } else {
                window.location.hash = '';
            }
        },
        /*
         * check for saved settings in url hash
         */
        _loadHashParameters: function (parameters) {
            try {
                if (parameters.indexOf('&') !== -1) {
                    parameters = parameters.split('&');
                } else {
                    parameters = [parameters];
                }
                for (var i in parameters) {
                    if (parameters[i].indexOf('CMV_appSettings') !== -1) {
                        this._appSettings = Json.parse(parameters[i].split('=')[1]);
                    }
                }
            } catch (error) {
                this._error('_loadHashParameters' + error);
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
        /*
         * applies the loaded settings
         */
        _loadAppSettings: function () {
            //load map extent
            try {
                if (this._appSettings.saveMapExtent.save) {
                    this.map.setExtent(new Extent(this._appSettings.saveMapExtent.value));
                }
            } catch (error) {
                this._error('_loadAppSettings:mapextent: ' + error);
            }

            //load visible layers
            try {
                if (this._appSettings.saveLayerVisibility.save) {
                    Array.forEach(this.layerInfos, Lang.hitch(this, function (layer) {
                        if (this._appSettings
                                .saveLayerVisibility
                                .hasOwnProperty(layer.layer.id)) {
                            if (this._appSettings
                                    .saveLayerVisibility[layer.layer.id]
                                    .visibleLayers) {
                                layer.layer.setVisibleLayers(
                                        this._appSettings
                                        .saveLayerVisibility[layer.layer.id]
                                        .visibleLayers);

                            }
                            if (this._appSettings
                                    .saveLayerVisibility[layer.layer.id]
                                    .visible !== null) {
                                layer.layer.setVisibility(this._appSettings
                                        .saveLayerVisibility[layer.layer.id]
                                        .visible);
                            }
                        }
                    }));
                }
            } catch (error) {
                this._error('_loadAppSettings:layervisibility: ' + error);
            }
        },
        /*
         * a helper function to manage event handlers
         */
        _setHandles: function () {
            //map extent handles
            if (this._appSettings.saveMapExtent.save) {
                this._appSettings.saveMapExtent.value = this.map.extent;
                if (!this.mapZoomHandle) {
                    this.mapZoomHandle = this.map.on('zoom-end', Lang.hitch(this, function (event) {
                        this._appSettings.saveMapExtent.value = event.extent;
                        this._saveAppSettings();
                    }));
                }
                if (!this.mapPanHandle) {
                    this.mapPanHandle = this.map.on('pan-end', Lang.hitch(this, function (event) {
                        this._appSettings.saveMapExtent.value = event.extent;
                        this._saveAppSettings();
                    }));
                }
            } else {
                this._appSettings.saveMapExtent.value = null;
                if (this.mapZoomHandle) {
                    this.mapZoomHandle.remove();
                    this.mapZoomHandle = null;
                }
                if (this.mapPanHandle) {
                    this.mapPanHandle.remove();
                    this.mapPanHandle = null;
                }
            }

            //layer visibility handles
            if (this._appSettings.saveLayerVisibility.save) {
                Array.forEach(this.layerInfos, Lang.hitch(this, function (layer, i) {
                    var id = layer.layer.id;
                    if (!this._appSettings.saveLayerVisibility.hasOwnProperty(id)) {
                        this._appSettings.saveLayerVisibility[id] = {
                            visible: layer.layer.visible,
                            visibleLayers: layer.layer.visibleLayers
                        };
                    }
                }));
                this.layerHandles = {
                    setVisibleLayers: Topic.subscribe('layerControl/setVisibleLayers', Lang.hitch(this, function (layer) {
                        this._appSettings.saveLayerVisibility[layer.id] = {
                            visibleLayers: layer.visibleLayers,
                            visible: true
                        };
                        this._saveAppSettings();
                    })),
                    layerToggle: Topic.subscribe('layerControl/layerToggle', Lang.hitch(this, function (layer) {
                        this._appSettings.saveLayerVisibility[layer.id].visible = layer.visible;
                        this._saveAppSettings();
                    }))
                };
            } else {
                this._appSettings.saveLayerVisibility = {save: false};
                if (this.layerHandles.setVisibleLayers) {
                    this.layerHandles.setVisibleLayers.remove();
                }
                if (this.layerHandles.layerToggle) {
                    this.layerHandles.layerToggle.remove();
                }
            }
            this._saveAppSettings();

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
            //if an error occurs local storage corruption or hash corruption
            // is probably the issue
            if (window.console) {
                console.error(e, localStorage.CMV_appSettings);
            }
            localStorage.clear();
            window.location.hash = '';
            this._appSettings = Lang.clone(this.defaultAppSettings);
        }

    });
});
