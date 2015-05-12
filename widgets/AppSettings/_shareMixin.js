define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/topic',
    'dojo/json',
    'dojo/dom-construct',
    'dijit/Dialog',
    'dojo/on',
    'dojo/_base/array',
    'esri/request',
    'dijit/Menu',
    'dijit/MenuItem',
], function (declare, lang, topic, json, domConstruct, Dialog, on, array, request,
        Menu, MenuItem) {
    return declare(null, {
        //email settings
        shareNode: null,
        shareTemplate: '<a href="#"><i class="fa fa-fw fa-envelope-o"></i>Share Map</a>',
        shareDialogTemplate: '<p>Right click the link below and choose Copy Link or Copy Shortcut:</p><p><a href="{0}">Share this map</a></p>',
        loadingDialogTemplate: '<div class="loading-spinner"></div><p>Loading...</p>',
        /* settings to share via email */
        emailSettings: ['mapExtent', 'layerVisibility'],
        address: '',
        subject: 'Share Map',
        body: '',
        //a url to use as a server for sharing urls
        server: '',
        _shareProperty: null,
        /**
         * creates the domnode for the share button
         */
        postCreate: function () {
            this.inherited(arguments);
            this._shareProperty = this.parameterName;
            //place share button/link
            if (this.shareNode !== null) {
                var share = domConstruct.place(this.shareTemplate, this.shareNode);
                this.own(on(share, 'click', lang.hitch(this, '_emailLink')));
            }

            this.own(on(this.defaultShareButton, 'click', lang.hitch(this, '_emailLink')));
            if (this.mapRightClickMenu) {
                this._addRightClickMenu();
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
        /**
         * handles the opening of a new email and displays a temporary dialog
         * in case the email fails to open
         */
        _emailLink: function () {
            this._showDialog(this.loadingDialogTemplate);
            var settings = {};
            array.forEach(this.emailSettings, lang.hitch(this, function (setting) {
                if (this._appSettings.hasOwnProperty(setting)) {
                    settings[setting] = this._appSettings[setting].value;
                }
            }));
            if (this.server) {
                this._saveSettingsOnServer(settings);
            } else {
                this._showDialog(lang.replace(this.shareDialogTemplate, [this._settingsToURL(settings)]));
            }
        },
        _saveSettingsOnServer: function (settings) {
            new request({
                url: this.server,
                content: {
                    action: 'set',
                    value: json.stringify(settings)
                },
                handleAs: 'json',
                usePost: true
            }).then(lang.hitch(this, function (data) {
                if (data.ID) {
                    var link = this._buildLink(data.ID);
                    try {
                        window.open('mailto:' + this.address + '?subject=' + this.subject +
                                '&body=' + this.body + ' ' + link, '_self');
                    } catch (e) {
                        this._error('_emailLink: ' + e);
                    }
                    this._showDialog(lang.replace(this.shareDialogTemplate, [link]));

                    //optional google analytics event
                    topic.publish('googleAnalytics/events', {
                        category: 'AppSettings',
                        action: 'map-share'
                    });
                } else {
                    this._error('an error occurred fetching the id');
                }
            }));
        },
        loadAppSettings: function () {
            //url parameters override 
            var settings = this._getQueryStringParameter(this.parameterName);
            if (settings) {
                if (this.server) {
                    this._requestSettingsFromServer(settings).then(lang.hitch(this, function (data) {
                        if (data.Value) {
                            this._loadSettingsFromParameter(data.Value);
                        }
                        this.init();
                    }));
                } else {
                    this._loadSettingsFromParameter(decodeURIComponent(settings));
                    this.init();
                }
                //don't override the user's settings and instead use a temp location
                //in local storage
                this.parameterName += '_urlLoad';
            } else {
                this.init();
            }
        },
        _requestSettingsFromServer: function (settings) {
            return new request({
                url: this.server,
                content: {
                    action: 'get',
                    id: settings
                },
                handleAs: 'json',
                usePost: true
            });
        },
        /**
         * 
         * @param {type} parameters
         * @returns {undefined}
         */
        _loadSettingsFromParameter: function (parameters) {
            try {
                var settings = json.parse(parameters);
                for (var s in settings) {
                    if (!this._appSettings.hasOwnProperty(s)) {
                        this._appSettings[s] = {};
                    }
                    if (settings.hasOwnProperty(s)) {
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
        _showDialog: function (content) {
            if (!this.shareDialog) {
                this.shareDialog = new Dialog({
                    title: 'Share Map',
                    content: content,
                    style: 'width: 300px; overflow:hidden;'
                });
            } else {
                this.shareDialog.set('content', content);
            }
            this.shareDialog.show();
        },
        /**
         * creates a share url form the settings
         * @param {object} settings - the settings to generate a url from
         * @returns {string} url
         */
        _settingsToURL: function (settings) {
            var jsonString = encodeURIComponent(json.stringify(settings));
            return this._buildLink(jsonString);
        },
        _buildLink: function (value) {
            var queryString;
            if (window.location.search !== '') {
                if (window.location.search.indexOf(this._shareProperty) !== -1) {

                    queryString = this._updateUrlParameter(
                            window.location.search,
                            this._shareProperty,
                            value
                            );
                }
                else {
                    queryString = [window.location.search,
                        '&',
                        this._shareProperty,
                        '=',
                        value].join('');

                }
            } else {
                queryString = ['?', this._shareProperty, '=', value].join('');

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
        }
    });
});