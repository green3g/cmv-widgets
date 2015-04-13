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
    'esri/geometry/Point',
    'esri/SpatialReference',
    'dojo/sniff',
    'dojo/ready',
    'dijit/Menu',
    'dijit/MenuItem',
    'dijit/form/CheckBox',
    'dijit/Dialog',
    'dojo/text!./AppSettings/templates/AppSettings.html',
    'dijit/form/Button'
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
        DomConstruct, topic, on, Array, Json, lang, Point, SpatialReference, has, ready,
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
//        serverParameterName: 'cmvServerSettings',
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
        baseClass: 'appSettings',
        postCreate: function () {
            this.inherited(arguments);
            //mix in additional default settings
            lang.mixin(this._defaultAppSettings, this.appSettings);
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

            if (this._appSettings.saveMapExtent.save ||
                    this._appSettings.saveMapExtent.urlLoad) {
                //once the saved map has finished zooming, set the handle
                var handle = this.map.on('zoom-end', lang.hitch(this, function () {
                    handle.remove();
                    this._setExtentHandles();
                }));
                //other widgets need to be ready to listen to extent
                //changes in the map
                ready(2, this, '_loadSavedExtent');
            } else {
                this._setExtentHandles();
            }
            if (this._appSettings.saveLayerVisibility.save ||
                    this._appSettings.saveLayerVisibility.urlLoad) {
                //needs to be ready so other widgets can update layers
                //accordingly
                ready(3, this, '_loadSavedLayers');
            }
            //needs to come after the loadSavedLayers function
            //so also needs to be ready
            ready(4, this, '_setLayerVisibilityHandles');
            //needs to wait for other widgets to load
            //so they can subscribe to topic
            ready(5, this, '_handletopics');
        },
        /**
         * loads the settings from localStorage and overrides the loaded settings
         * with values in the url parameters
         */
        _loadAppSettings: function () {
            //start with default
            this._appSettings = lang.clone(this._defaultAppSettings);
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
                                lang.mixin(this._appSettings[setting], loadedSettings[setting]);
                            }
                        }
                    }
                } catch (error) {
                    this._error('_loadLocalStorage: ' + error);
                }
            }
            //url parameters override 
            var settings = this._getQueryStringParameter(this.parameterName);
            if (settings) {
                this._loadSettingsFromParameter(settings);
            }
//            else {
//                settings = this._getQueryStringParameter(this.serverParameterName);
//                if (settings) {
//                    //call a function to fetch the app settings from a server
//                    //this._fetchAppSettings(settings, lang.hitch(this, '_loadSettingsFromURL'));
//                }
//            }
        },
        /**
         * 
         * @param {type} parameter
         * @returns {Boolean}
         */
        _getQueryStringParameter: function (parameter) {
            var search = decodeURI(window.location.search), parameters;
            if (search.indexOf(parameter) !== -1) {
                if (search.indexOf('&') !== -1) {
                    parameters = search.split('&');
                } else {
                    parameters = [search];
                }
                for (var i in parameters) {
                    if (parameters[i].indexOf(parameter) !== -1) {
                        return parameters[i].split('=')[1];
                    }
                }
            }
            return false;
        },
        /**
         * 
         * @param {type} parameters
         * @returns {undefined}
         */
        _loadSettingsFromParameter: function (parameters) {
            try {
                var settings = Json.parse(decodeURIComponent(parameters));
                for (var s in settings) {
                    if (settings.hasOwnProperty(s) && this._appSettings.hasOwnProperty(s)) {
                        this._appSettings[s].value = settings[s];
                        //set urlLoad flag override
                        //this tells the widget that the settings were loaded via 
                        //url and should be loaded regardless of the user's checkbox
                        this._appSettings[s].urlLoad = true;
                    }
                }
            } catch (error) {
                this._error('_loadURLParameters' + error);
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
         * @param {object} setting
         */
        _addCheckbox: function (setting) {
            var li = DomConstruct.create('li', null, this.settingsList);
            this._appSettings[setting]._checkboxNode = new Checkbox({
                id: setting,
                checked: this._appSettings[setting].save,
                onChange: lang.hitch(this, (function (setting) {
                    return function (checked) {
                        //optional, publish a google analytics event
                        topic.publish('googleAnalytics/events', {
                            category: 'AppSettings',
                            action: 'checkbox',
                            label: setting,
                            value: checked ? 1 : 0
                        });
                        this._appSettings[setting].save = checked;
                        this._saveAppSettings();
                    };
                }(setting)))
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
        _handletopics: function () {
            this.own(topic.subscribe('AppSettings/setValue', lang.hitch(this, function (key, value) {
                this._setValue(key, value);
            })));
            //handle external widget errors
            try {
                topic.publish('AppSettings/onSettingsLoad', lang.clone(this._appSettings));
            } catch (e) {
                this._error({location: 'AppSettings:_handletopics:onSettingsLoad', error: e});
            }
        },
        /**
         * creates the right click map menu
         */
        _addRightClickMenu: function () {
            this.menu = new Menu();
            this.mapRightClickMenu.addChild(new MenuItem({
                label: 'Share Map',
                onClick: lang.hitch(this, '_emailLink')
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
                lang.mixin(this._appSettings[key], settingsObj);
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
         * @param {object} settings
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
                        value: lang.clone(this._appSettings[setting].value)
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
            var center = this._appSettings.saveMapExtent.value.center;
            var point = new Point(center.x, center.y, new SpatialReference({
                wkid: center.spatialReference.wkid
            }));
            if (has('ie')) {
                //work around an ie bug
                setTimeout(lang.hitch(this, function () {
                    this.map.centerAndZoom(point,
                            this._appSettings.saveMapExtent.value.zoom);
                }), 800);
            } else {
                this.map.centerAndZoom(point,
                        this._appSettings.saveMapExtent.value.zoom);
            }
            //reset url flag
            this._appSettings.saveMapExtent.urlLoad = false;
        },
        /**
         * sets the visibility of the loaded layers if save or urlLoad is true
         */
        _loadSavedLayers: function () {
            var layers = this._appSettings.saveLayerVisibility.value;
            //load visible layers
            Array.forEach(this.layerInfos, lang.hitch(this, function (layer) {
                if (layers.hasOwnProperty(layer.layer.id)) {
                    if (layers[layer.layer.id].visibleLayers) {
                        layer.layer.setVisibleLayers(layers[layer.layer.id].visibleLayers);
                        topic.publish('layerControl/setVisibleLayers', {
                            id: layer.layer.id,
                            visibleLayers: layers[layer.layer.id]
                                    .visibleLayers
                        });
                    }
                    if (layers[layer.layer.id].visible !== null) {
                        layer.layer.setVisibility(layers[layer.layer.id].visible);
                    }
                }
            }));
            //reset url flag
            this._appSettings.saveLayerVisibility.urlLoad = false;
        },
        _setExtentHandles: function () {
            this._appSettings.saveMapExtent.value = {};
            this.own(this.map.on('extent-change', lang.hitch(this, function () {
                this._appSettings.saveMapExtent.value.center = this.map.extent.getCenter();
                this._appSettings.saveMapExtent.value.zoom = this.map.getZoom();
                this._saveAppSettings();
            })));
        },
        _setLayerVisibilityHandles: function () {
            var setting = this._appSettings.saveLayerVisibility;
            setting.value = {};
            //since the javascript api visibleLayers property starts
            //with a different set of layers than what is actually turned
            //on, we need to iterate through, find the parent layers, 
            Array.forEach(this.layerInfos, lang.hitch(this, function (layer) {
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
            this.own(topic.subscribe('layerControl/setVisibleLayers', lang.hitch(this, function (layer) {
                setting.value[layer.id].visibleLayers = layer.visibleLayers;
                this._saveAppSettings();
            })));
            this.own(topic.subscribe('layerControl/layerToggle', lang.hitch(this, function (layer) {
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
            var json = encodeURIComponent(Json.stringify(settings));
            if (window.location.search !== '') {
                if (window.location.search.indexOf(this.parameterName) !== -1) {

                    queryString = this._updateUrlParameter(
                            window.location.search,
                            this.parameterName,
                            json
                            );
                }
                else {
                    queryString = [window.location.search,
                        '&',
                        this.parameterName,
                        '=',
                        json].join('');

                }
            } else {
                queryString = ['?', this.parameterName, '=', json].join('');

            }
            //build url using window.location
            return [window.location.protocol + '//',
                window.location.host,
                window.location.pathname,
                queryString].join('');
        },
        _updateUrlParameter: function (url, param, value) {
            var regex = new RegExp('([?|&]' + param + '=)[^\&]+');
            return url.replace(regex, '$1' + value);
        },
        /**
         * in case something goes wrong, the settings are reset.
         * the user has the option to reset without manually clearing their cache
         */
        _clearCache: function () {
            this._appSettings = lang.clone(this._defaultAppSettings);
            this._saveAppSettings();
            this._refreshView();
        },
        /**
         * handles the opening of a new email and displays a temporary dialog
         * in case the email fails to open
         */
        _emailLink: function () {

            var settings = {};
            Array.forEach(this.emailSettings, lang.hitch(this, function (setting) {
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
            var shareContent = ['<p>Right click the link below',
                'and choose Copy Link or Copy Shortcut:</p>',
                '<p><a href="', link, '">Share this map</a></p>'].join('');
            if (!this.shareDialog) {
                this.shareDialog = new Dialog({
                    title: 'Share Map',
                    content: shareContent,
                    style: 'width: 300px; overflow:hidden;'
                });
            } else {
                this.shareDialog.setContent(shareContent);
            }
            this.shareDialog.show();
            //optional google analytics event
            topic.publish('googleAnalytics/events', {
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
                this.own(on(share, 'click', lang.hitch(this, '_emailLink')));
            }

            this.own(on(this.defaultShareButton, 'click', lang.hitch(this, '_emailLink')));
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
            topic.publish('viewer/handleError', {
                source: 'AppSettings',
                error: e
            });
            topic.publish('growler/growl', {
                title: 'Settings',
                message: ['Something went wrong..and your saved settings were cleared.',
                    'To re-enable them click Help/Settings'].join(' '),
                timeout: 7000
            });
            this._clearCache();
        }

    });
});
