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
        widgetsInTemplate: true,
        templateString: appSettingsTemplate,
        appSettings: null,
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
        
        //email settings
        shareNode: null,
        shareTemplate: '<a href="#">Share Map</a>',
        emailSettings: ['saveMapExtent', 'saveLayerVisibility', 'storeURL'],
        address: '',
        subject: 'Share Map',
        body: '',
        
        //layer handles
        layerHandles: null,
        checkboxHandles: null,
        constructor: function () {
            this.appSettings = this.defaultAppSettings;
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
            console.log(this);
            this.layerHandles = [];
            this.checkboxHandles = {};
            if (!this.map || !this.layerInfos) {
                this._disable();
                this._error('AppSettings requires map and tocLayerInfos');
            } else {
                this._loadAppSettings();
                this._setHandles();
                for (var setting in this.appSettings) {
                    if (this.hasOwnProperty(setting)) {
                        this.checkboxHandles[setting] =
                                On(this[setting], 'change', Lang.hitch(this, function (setting) {
                                    return function (checked) {
                                        this.setValue(setting, checked);
                                    };
                                }(setting)));
                    }
                }

                On(this.clearCacheButton, 'click', Lang.hitch(this, function () {
                    this.appSettings = this.defaultAppSettings;
                    this.saveAppSettings();
                    this.refreshView();
                }));
                if (this.shareNode !== null) {
                    var share = DomConstruct.place(this.shareTemplate, this.shareNode);
                    On(share, 'click', Lang.hitch(this, function () {
                        this.emailLink();
                    }));
                }
                if (this.mapRightClickMenu) {
                    this.addRightClickMenu();
                }
            }
        },
        addRightClickMenu: function () {
            this.menu = new Menu();
            this.mapRightClickMenu.addChild(new MenuItem({
                label: 'Share Map',
                onClick: Lang.hitch(this, 'emailLink')
            }));
        },
        emailLink: function () {
            var currentSettings = Lang.clone(this.appSettings);
            //enable required settings for email
            Array.forEach(this.emailSettings, Lang.hitch(this, function (setting) {
                this.setValue(setting, true);
            }));
            var link = encodeURIComponent(window.location + '\r\n\r\n');
            window.open('mailto:' + this.address + '?subject=' + this.subject + '&body=' + this.body + '\n\n' + link, '_self');
            this.appSettings = currentSettings;
            this._setHandles();
            this.saveAppSettings();
            this.refreshView();
        },
        /*
         * 
         * @param {type} key string to identify setting to set
         * @param {object} value value to set as setting
         * @returns {undefined}
         */
        setValue: function (key, value) {
            this.appSettings[key].save = value;
            this._setHandles();
            this.saveAppSettings();
            this.refreshView();
        },
        /*
         * gets an app setting
         * @param {string} key value to lookup in appSettings
         * @returns {object | -1} returns -1 if key does not exist
         */
        getValue: function (key) {
            return this.appSettings[key] || -1;
        },
        /*
         * sets the current value of this.appSettings to localStorage
         * and url hash if storeURL is true
         */
        saveAppSettings: function () {
            var settingsString = Json.stringify(this.appSettings);
            localStorage.setItem('CMV_appSettings', settingsString);

            //setup store url
            if (this.appSettings.storeURL.save) {
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
                        this.appSettings = Json.parse(parameters[i].split('=')[1]);
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
                    this.appSettings = Json.parse(CMV_appSettings);

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
                if (this.appSettings.saveMapExtent.save) {
                    this.map.setExtent(new Extent(this.appSettings.saveMapExtent.value));
                }
            } catch (error) {
                this._error('_loadAppSettings:mapextent: ' + error);
            }

            //load visible layers
            try {
                if (this.appSettings.saveLayerVisibility.save) {
                    Array.forEach(this.layerInfos, Lang.hitch(this, function (layer) {
                        if (this.appSettings
                                .saveLayerVisibility
                                .hasOwnProperty(layer.layer.id)) {
                            if (this.appSettings
                                    .saveLayerVisibility[layer.layer.id]
                                    .visibleLayers) {
                                layer.layer.setVisibleLayers(
                                        this.appSettings
                                        .saveLayerVisibility[layer.layer.id]
                                        .visibleLayers);

                            }
                            if (this.appSettings
                                    .saveLayerVisibility[layer.layer.id]
                                    .visible !== null) {
                                layer.layer.setVisibility(this.appSettings
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
            if (this.appSettings.saveMapExtent.save) {
                this.appSettings.saveMapExtent.value = this.map.extent;
                if (!this.mapZoomHandle) {
                    this.mapZoomHandle = this.map.on('zoom-end', Lang.hitch(this, function (event) {
                        this.appSettings.saveMapExtent.value = event.extent;
                        this.saveAppSettings();
                    }));
                }
                if (!this.mapPanHandle) {
                    this.mapPanHandle = this.map.on('pan-end', Lang.hitch(this, function (event) {
                        this.appSettings.saveMapExtent.value = event.extent;
                        this.saveAppSettings();
                    }));
                }
            } else {
                this.appSettings.saveMapExtent.value = null;
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
            if (this.appSettings.saveLayerVisibility.save) {

                Array.forEach(this.layerInfos, Lang.hitch(this, function (layer, i) {
                    var id = layer.layer.id;
                    if (!this.appSettings.saveLayerVisibility.hasOwnProperty(id)) {
                        this.appSettings.saveLayerVisibility[id] = {
                            visible: layer.layer.visible,
                            visibleLayers: layer.layer.visibleLayers
                        };
                    }
                }));
                this.layerHandles = {
                    setVisibleLayers: Topic.subscribe('layerControl/setVisibleLayers', Lang.hitch(this, function (layer) {
                        this.appSettings.saveLayerVisibility[layer.id] = {
                            visibleLayers: layer.visibleLayers,
                            visible: true
                        };
                        this.saveAppSettings();
                    })),
                    layerToggle: Topic.subscribe('layerControl/layerToggle', Lang.hitch(this, function (layer) {
                        this.appSettings.saveLayerVisibility[layer.id].visible = layer.visible;
                        this.saveAppSettings();
                    }))
                };
            } else {
                this.appSettings.saveLayerVisibility = {save: false};
                if (this.layerHandles.setVisibleLayers) {
                    this.layerHandles.setVisibleLayers.remove();
                }
                if (this.layerHandles.layerToggle) {
                    this.layerHandles.layerToggle.remove();
                }
                this.saveAppSettings();
            }

        },
        refreshView: function () {
            for (var setting in this.appSettings) {
                if (this.hasOwnProperty(setting)) {
                    this[setting].set('checked', this.appSettings[setting].save);
                }
            }
        },
        /*
         * disables this widget ui
         */
        _disable: function () {
            for (var setting in this.appSettings) {
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
            this.appSettings = this.defaultAppSettings;
        }

    });
});
