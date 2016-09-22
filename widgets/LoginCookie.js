/* https://developers.arcgis.com/javascript/3/jssamples/widget_identitymanager_client_side.html */
define(['dojo/_base/declare',
    'dojo/_base/window',
    'dojo/_base/lang',
    'dojo/cookie',
    'esri/IdentityManager',
], function(declare, window, lang, cookie, esriId) {
    var global = window.global;
    return declare('cmv.LoginCookie', [], {
        /**
         * the local storage or cookie key name
         * @type {String}
         */
        key: 'esri_cred',
        /**
         * initializes the event listener to store credentials and
         * loads existing credentials into the identity manager
         */
        constructor: function(params, domNode) {
            this.inherited(arguments);
            lang.mixin(this, params);

            //remember credentials once they're created
            esriId.on('credential-create', lang.hitch(this, 'storeCredentials'));

            //initialize our saved credentials
            this.loadCredentials();
        },
        /**
         * Store the credentials in local storage for next time
         */
        storeCredentials: function() {
            // make sure there are some credentials to persist
            if (esriId.credentials.length === 0) {
                return;
            }

            // serialize the ID manager state to a string
            var idString = JSON.stringify(esriId.toJson());
            // store it client side
            if (this.supportsLocalStorage()) {
                // use local storage
                global.localStorage.setItem(this.key, idString);
                // console.log("wrote to local storage");
            } else {
                // use a cookie
                cookie(this.key, idString, {
                    expires: 1
                });
                // console.log("wrote a cookie :-/");
            }
        },
        /**
         * initialize the esri identity manager with credentials if they were stored
         */
        loadCredentials: function() {
            if (this.credentials) {
                esriId.initialize(this.credentials);
                // console.log('provided credentials were initialized');
                return;
            }
            var idJson, idObject;

            if (this.supportsLocalStorage()) {
                // read from local storage
                idJson = global.localStorage.getItem(this.key);
            } else {
                // read from a cookie
                idJson = cookie(this.key);
            }

            if (idJson && idJson != "null" && idJson.length > 4) {
                try {
                    idObject = JSON.parse(idJson);
                    esriId.initialize(idObject);
                } catch (e) {
                    //TODO: growl
                    // console.log(e);
                }
            } else {
                // console.log("didn't find anything to load :(");
            }
        },
        /**
         * Checks for local storage support
         * @return {Boolean}  whether or not local storage is supported
         */
        supportsLocalStorage: function() {
            try {
                return "localStorage" in global && global.localStorage !== null;
            } catch (e) {
                return false;
            }
        },
        /**
         * clears existing credentials from local storage or cookie. Essentially
         * like a logout function, except it doesn't remove credentials from memory
         * in the identity manager
         */
        clearCredentials: function() {
            if (this.supportsLocalStorage()) {
                global.localStorage.removeItem(this.key);
            } else {
                cookie(this.key, '', {});
            }
        }

    });
});
