define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/topic',
    'dojo/json',
    'dojo/dom-construct',
    'dijit/Dialog',
    'dojo/on',
    'dojo/_base/array',
    'esri/request'
], function (declare, lang, topic, json, domConstruct, Dialog, on, array, request) {
    return declare(null, {
        //email settings
        shareNode: null,
        shareTemplate: '<a href="#"><i class="fa fa-fw fa-envelope-o"></i>Share Map</a>',
        shareDialogTemplate: '<p>Right click the link below and choose Copy Link or Copy Shortcut:</p><p><a href="{0}">Share this map</a></p>',
        loadingDialogTemplate: '<div class="loading-spinner"></div><p>Loading...</p>',
        /* settings to share via email */
        emailSettings: ['saveMapExtent', 'saveLayerVisibility'],
        address: '',
        subject: 'Share Map',
        body: '',
        //a url to use as a server for sharing urls
        server: '',
        /**
         * creates the domnode for the share button
         */
        _handleShare: function () {
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
        _requestSettingsFromServer: function (settings) {
            new request({
                url: this.server,
                content: {
                    action: 'get',
                    id: settings
                },
                handleAs: 'json',
                usePost: true
            }).then(lang.hitch(this, function (data) {
                if (data.Value) {
                    this._loadSettingsFromParameter(data.Value);
                }
                this._init();
            }));
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
                if (window.location.search.indexOf(this.parameterName) !== -1) {

                    queryString = this._updateUrlParameter(
                            window.location.search,
                            this.parameterName,
                            value
                            );
                }
                else {
                    queryString = [window.location.search,
                        '&',
                        this.parameterName,
                        '=',
                        value].join('');

                }
            } else {
                queryString = ['?', this.parameterName, '=', value].join('');

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
        }
    });
});