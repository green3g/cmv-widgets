define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dijit/_WidgetBase',
    'dijit/Dialog',
    'dijit/DialogUnderlay',
    'dojo/topic',
    'esri/request',
    'dojo/text!./MetadataDialog/templates/dialogContent.html',
    'xstyle/css!./MetadataDialog/css/MetadataDialog.css'
], function (declare, lang, _WidgetBase, Dialog, DialogUnderlay, topic, request, dialogContent) {
    return declare([_WidgetBase], {
        dialog: null,
        dialogTemplate: dialogContent,
        postCreate: function () {
            this.inherited(arguments);
            topic.subscribe('LayerControl/showMetadata', lang.hitch(this, '_fetchMetadata'));
        },
        _fetchMetadata: function (event) {
            new request({
                url: event.layer.url + '/' + event.subLayer.id,
                content: {
                    f: 'json'
                }
            })
            .then(lang.hitch(this, '_showMetadata'))
            .otherwise(lang.hitch(this, '_handleError'));
        },
        _showMetadata: function (data) {
            if (!this.dialog) {
                this._createDialog(lang.replace(this.dialogTemplate, data));
            } else {
                this.dialog.set('content', lang.replace(this.dialogTemplate, data));
            }
            this.dialog.show();
            DialogUnderlay.hide();
        },
        _handleError: function(e){
          this._showMetadata({
            id: e,
            name: 'Error',
            description: 'The query could not execute. Is a proxy configured?'
          });
        },
        _createDialog: function (content) {
            this.dialog = new Dialog({
                title: 'Layer Metadata',
                content: content || '',
                style: 'width:400px;height:450px;',
                open: false
            });
        }
    });
});
