define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/dom-construct',
    'dojo/topic',
    'dojo/json',
    'dojo/_base/lang',
    'dojo/ready',
    'dijit/form/CheckBox',
    './AppSettings/_extentMixin',
    './AppSettings/_layerMixin',
    './AppSettings/_shareMixin',
    'dojo/text!./AppSettings/templates/AppSettings.html',
    'dijit/form/Button'
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    DomConstruct, topic, json, lang, ready, Checkbox,
    _extentMixin, _layerMixin, _shareMixin, appSettingsTemplate) {
    //this widget uses several mixins to add additional functionality
    //additional mixins may be added
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
        _extentMixin, _layerMixin, _shareMixin
    ], {
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
        /* private */
        widgetsInTemplate: true,
        templateString: appSettingsTemplate,
        _defaultAppSettings: {},
        _appSettings: null,
        baseClass: 'appSettings',
        postCreate: function () {
            this.inherited(arguments);
            //mixin additional default properties
            lang.mixin(this._defaultAppSettings, this.appSettings);
            //initialize the object
            this._appSettings = lang.clone(this._defaultAppSettings);
            this.loadAppSettings();
        },
        /**
         * this method is called after settings are loaded
         * mixins may use this method to apply loaded settings
         * mixins init method must call this.inherited(arguments) to ensure
         * other mixins load properly
         */
        init: function () {
            this._initialized = true;
            this.inherited(arguments);
            //call mixins init method
            this._setCheckboxHandles();
            //needs to wait for other widgets to load
            //so they can subscribe to topic
            ready(10, this, '_handletopics');
        },
        /**
         * loads the settings from localStorage and overrides the loaded settings
         * with values in the url parameters
         * Up to one additional mixin may use this method
         * This method is responsible for calling the init method
         */
        loadAppSettings: function () {
            //mixin local storage
            if (localStorage[this.parameterName]) {
                //this may fail if json is invalid
                try {
                    //parse the settings
                    var loadedSettings = json.parse(localStorage.getItem(this.parameterName));
                    //store each setting that was loaded
                    //override the default
                    for (var setting in loadedSettings) {
                        if (loadedSettings.hasOwnProperty(setting) &&
                            this._appSettings.hasOwnProperty(setting)) {
                            //mixin the setting
                            lang.mixin(this._appSettings[setting], loadedSettings[setting]);
                        }
                    }
                } catch (error) {
                    this._error('_loadLocalStorage: ' + error);
                }
            }
            if (!this._initialized) {
                this.init();
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
            console.log(this._appSettings);
            topic.publish('AppSettings/onSettingsLoad', lang.clone(this._appSettings));
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
            return json.stringify(settings);
        },
        /**
         * in case something goes wrong, the settings are reset.
         * the user has the option to reset without manually clearing their cache
         */
        _clearCache: function () {
            for (var setting in this._appSettings) {
                if (this._defaultAppSettings.hasOwnProperty(setting)) {
                    lang.mixin(this._appSettings[setting], this._defaultAppSettings[setting]);
                } else {
                    delete this._appSettings[setting];
                }
            }
            this._saveAppSettings();
            this._refreshView();
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
                    'To re-enable them click Help/Settings'
                ].join(' '),
                timeout: 7000
            });
            this._clearCache();
        }

    });
});
