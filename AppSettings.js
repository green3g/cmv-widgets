/**
 * 
 * Dijit Title: AppSettings
 * Description: A dijit that allows the user to save 
 * the current state of the map extent and visible layers.
 * 
 * Limitations: 
 * Currently only works with dynamicMapService layers.
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
    'dojo/_base/array',
    'dojo/json',
    'dojo/_base/lang',
    'dijit/form/CheckBox',
    'esri/geometry/Extent',
    'dojo/text!./AppSettings/templates/AppSettings.html'
], function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
        Array, Json, Lang, Checkbox, Extent, appSettingsTemplate) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        widgetsInTemplate: true,
        templateString: appSettingsTemplate,
        appSettings: {
            saveMapExtent: {
                save: true,
                value: null
            },
            saveLayerVisibility: {
                save: true,
                value: null
            },
            shareURL: {
                save: true
            }
        },
        layerHandles: null,
        postCreate: function() {
            this.inherited(arguments);

            this.layerHandles = [];
            this.appSettings.saveLayerVisibility.value = {};

            if (!this.map || !this.layerInfos) {
                this._disable();
                this._error('AppSettings requires map and tocLayerInfos');
            }
            var parameters = decodeURI(window.location.href.split('#')[1]);
            if (parameters.indexOf('CMV_appSettings') !== -1) {
                this._loadHashParameters(parameters);
                this._setDefaults();
            } else if (window.localStorage) {
                this._loadLocalStorage();
                this._setDefaults();
                this._setHandles();
            }
            //if no localstorage capabilities exist, disable this widget
            if (!window.localStorage) {
                this._disable();
            }
        },
        /*
         * sets the current value of this.appSettings to localStorage
         * and url hash if shareURL is true
         */
        saveSettings: function() {
            var settingsString = Json.stringify(this.appSettings);
            localStorage.setItem('CMV_appSettings', settingsString);

            //setup share url
            if (this.appSettings.shareURL.save) {
                var shareURL = encodeURI('CMV_appSettings=' + settingsString);
                window.location.hash = shareURL;
            }
        },
        /*
         * setters for the appSettings
         * @param {boolean} value
         */
        setSaveLayerVisibility: function(value) {
            this.appSettings.saveLayerVisibility.save = value;
            this._setHandles();
            this.saveSettings();
        },
        setSaveMapExtent: function(value) {
            this.appSettings.saveMapExtent.save = value;
            this._setHandles();
            this.saveSettings();
        },
        setShareURL: function(value) {
            this.appSettings.shareURL.save = value;
            if (!value) {
                window.location.hash = '';
            }
            this._setHandles();
            this.saveSettings();
        },
        /*
         * check for saved settings in url hash
         */
        _loadHashParameters: function(parameters) {
            try {
                if (parameters.indexOf('&') !== -1) {
                    parameters = parameters.split('&');
                } else {
                    parameters = [parameters];
                }
                for (var i in parameters) {
                    if (parameters[i].indexOf('CMV_appSettings') !== -1) {
                        this.appSettings = Json.parse(parameters[i].split('=')[1]);
                        window.location.hash = '';
                    }
                }
            } catch (error) {
                this._error('_loadHashParameters' + error);
            }
        },
        /*
         * check for saved settings in local storage
         */
        _loadLocalStorage: function() {
            try {
                var CMV_appSettings = localStorage.getItem('CMV_appSettings');
                if (CMV_appSettings) {
                    this.appSettings = Json.parse(CMV_appSettings);
                }
            } catch (error) {
                this._error('_loadLocalStorage: ' + error);
            }
        },
        /*
         * applies the default settings loaded
         */
        _setDefaults: function() {
            try {
                //load checkbox settings
                for (var setting in this.appSettings) {
                    if (this.hasOwnProperty(setting)) {
                        this[setting].set('checked', this.appSettings[setting].save);
                    }
                }

                //load map extent
                if (this.appSettings.saveMapExtent.save) {
                    this.map.setExtent(new Extent(this.appSettings.saveMapExtent.value));
                }

                //load visible layers
                if (this.appSettings.saveLayerVisibility.save) {
                    Array.forEach(this.layerInfos, Lang.hitch(this, function(layer) {
                        layer.layer.setVisibleLayers(this.appSettings.saveLayerVisibility.value[layer.layer.id]);
                    }));
                }
            } catch (error) {
                this._error(error);
            }
        },
        /*
         * a helper function to manage event handlers
         */
        _setHandles: function() {
            //map extent handles
            if (this.appSettings.saveMapExtent.save) {
                if (!this.mapZoomHandle) {
                    this.mapZoomHandle = this.map.on('zoom-end', Lang.hitch(this, function(event) {
                        this.appSettings.saveMapExtent.value = event.extent;
                        this.saveSettings();
                    }));
                }
                if (!this.mapPanHandle) {
                    this.mapPanHandle = this.map.on('pan-end', Lang.hitch(this, function(event) {
                        this.appSettings.saveMapExtent.value = event.extent;
                        this.saveSettings();
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
                Array.forEach(this.layerInfos, Lang.hitch(this, function(layer, i) {
                    if (!this.layerHandles[i]) {
                        this.layerHandles[i] = layer.layer.on('update-end',
                                Lang.hitch(this, function(event) {
                                    this.appSettings.saveLayerVisibility.value[layer.layer.id] = event.target.visibleLayers;
                                    this.saveSettings();
                                }));
                    }
                }));
            }
            else {
                this.appSettings.saveLayerVisibility.value = null;
                Array.forEach(this.layerHandles, Lang.hitch(this, function(handle) {
                    if (handle) {
                        handle.remove();
                        handle = null;
                    }
                }));
            }
        },
        /*
         * disables this widget ui
         */
        _disable: function() {
            for (var setting in this.appSettings) {
                if (this.hasOwnProperty(setting)) {
                    this[setting].set('disabled', 'disabled');
                }
            }
        },
        /*
         * a helper error logging function
         */
        _error: function(e) {
            //if an error occurs local storage corruption is probably the issue
            if (window.console) {
                console.log(e, localStorage);
            }
            localStorage.clear();
        }

    });
});