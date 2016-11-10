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
    'dijit/MenuItem'
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
    //whether to show the share dialog
        showShareDialog: true,
        shareProperty: null,
    /**
     * creates the domnode for the share button
     */
        postCreate: function () {
            this.inherited(arguments);
            this.shareProperty = this.parameterName;
      //place share button/link
            if (this.shareNode !== null) {
                var share = domConstruct.place(this.shareTemplate, this.shareNode);
                this.own(on(share, 'click', lang.hitch(this, 'emailLink')));
            }

            this.own(on(this.defaultShareButton, 'click', lang.hitch(this, 'emailLink')));
            if (this.mapRightClickMenu) {
                this.addRightClickMenu();
            }
            if (window.location.search.indexOf(this.shareProperty) !== -1) {
        //override the default loadAppSettings function
                this.set('loadAppSettings', this.loadAppSettingsOverride);
            }
        },
        loadAppSettingsOverride: function () {
            var settings = this.getQueryStringParameter(this.parameterName);
            if (this.server) {
                this.requestSettingsFromServer(settings).then(lang.hitch(this, 'handleServerData'));
            } else {
                this.loadSettingsFromParameter(decodeURIComponent(settings));
                this.init();
            }
      //don't override the user's settings and instead use a temp location
      //in local storage
            this.parameterName += '_urlLoad';
        },
        handleServerData: function (data) {
            if (data.Value) {
                this.loadSettingsFromParameter(data.Value);
            }
            this.init();
        },
    /**
     * creates the right click map menu
     */
        addRightClickMenu: function () {
            this.menu = new Menu();
            this.mapRightClickMenu.addChild(new MenuItem({
                label: 'Share Map',
                onClick: lang.hitch(this, 'emailLink')
            }));
        },
    /**
     * handles the opening of a new email and displays a temporary dialog
     * in case the email fails to open
     */
        emailLink: function () {
            this.showDialog(this.loadingDialogTemplate);
            var settings = {};
            array.forEach(this.emailSettings, lang.hitch(this, function (setting) {
                if (this._appSettings.hasOwnProperty(setting)) {
                    settings[setting] = this._appSettings[setting].value;
                }
            }));
            if (this.server) {
                this.saveSettingsOnServer(settings);
            } else if (this.showShareDialog) {
                this.showDialog(lang.replace(this.shareDialogTemplate, [this.settingsToURL(settings)]));
            }
        },
        saveSettingsOnServer: function (settings) {
            new request({
                url: this.server,
                content: {
                    action: 'set',
                    value: json.stringify(settings)
                },
                handleAs: 'json',
                usePost: true
            }).then(lang.hitch(this, 'handleSaveResults'));
        },
        handleSaveResults: function (data) {
            if (data.ID) {
                var link = this.buildLink(data.ID);
                try {
                    window.open('mailto:' + this.address + '?subject=' + this.subject +
            '&body=' + this.body + ' ' + link, '_self');
                } catch (e) {
                    this._error('emailLink: ' + e);
                }
                if (this.showShareDialog) {
                    this.showDialog(lang.replace(this.shareDialogTemplate, [link]));
                }
        //optional google analytics event
                topic.publish('googleAnalytics/events', {
                    category: 'AppSettings',
                    action: 'map-share'
                });
            } else {
                this._error('an error occurred fetching the id');
            }
        },
        requestSettingsFromServer: function (settings) {
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
        loadSettingsFromParameter: function (parameters) {
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
        showDialog: function (content) {
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
        settingsToURL: function (settings) {
            var jsonString = encodeURIComponent(json.stringify(settings));
            return this.buildLink(jsonString);
        },
        buildLink: function (value) {
            var queryString;
            if (window.location.search !== '') {
                if (window.location.search.indexOf(this.shareProperty) !== -1) {

                    queryString = this.replaceUrlParameter(
            window.location.search,
            this.shareProperty,
            value
          );
                } else {
                    queryString = [window.location.search,
            '&',
            this.shareProperty,
            '=',
            value
          ].join('');

                }
            } else {
                queryString = ['?', this.shareProperty, '=', value].join('');

            }
      //build url using window.location
            return [window.location.protocol + '//',
        window.location.host,
        window.location.pathname,
        queryString
      ].join('');
        },
        replaceUrlParameter: function (url, param, value) {
            var regex = new RegExp('([?|&]' + param + '=)[^\&]+');
            return url.replace(regex, '$1' + value);
        },
    /**
     *
     * @param {type} parameter
     * @returns {Boolean}
     */
        getQueryStringParameter: function (parameter) {
            var search = decodeURI(window.location.search),
                parameters;
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
