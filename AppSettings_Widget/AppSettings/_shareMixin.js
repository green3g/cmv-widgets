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
    'dojo/json'
], function (declare, lang, topic, json, domConstruct, Dialog, on, array, request, json) {
    return declare(null, {
        //email settings
        shareNode: null,
        shareTemplate: '<a href="#"><i class="fa fa-fw fa-envelope-o"></i>Share Map</a>',
        /* settings to share via email */
        emailSettings: ['saveMapExtent', 'saveLayerVisibility'],
        address: '',
        subject: 'Share Map',
        body: '',
        //a url to use as a server for sharing urls
        server: null,
        /**
         * creates the domnode for the share button
         */
        _handleShare: function () {
            //place share button/link
            if (this.shareNode) {
                try {
                    var share = domConstruct.place(this.shareTemplate, this.shareNode);
                    this.own(on(share, 'click', lang.hitch(this, '_emailLink')));
                } catch (e) {
                    topic.publish('viewer/handleError', {
                        source: 'AppSettings',
                        error: 'Unable to place share link: ' + e
                    });
                }
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
            this._showLoadingDialog();
            var settings = {};
            array.forEach(this.emailSettings, lang.hitch(this, function (setting) {
                if (this._appSettings.hasOwnProperty(setting)) {
                    settings[setting] = this._appSettings[setting].value;
                }
            }));
            if (this.server) {
                this._saveSettingsOnServer(settings);
            } else {
                this._showDialog(this._settingsToURL(settings));
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
                    this._showDialog(this._buildLink(data.ID));
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
        _showLoadingDialog: function () {
            var shareContent = '<div class="loading-spinner"></div><p>Loading...</p>';
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
        },
        _showDialog: function (link) {
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
