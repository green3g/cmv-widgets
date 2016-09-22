define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dijit/_WidgetBase',
    'dijit/Dialog',
    'dijit/DialogUnderlay',
    'dijit/_WidgetsInTemplateMixin',
    'dgrid/Grid',
    'dojo/topic',
    'esri/request',
    'dojo/text!./MetadataDialog/templates/dialogContent.html',
    'xstyle/css!./MetadataDialog/css/MetadataDialog.css',
    'dijit/layout/TabContainer',
    'dijit/layout/ContentPane'
], function(declare, lang, _WidgetBase, Dialog, DialogUnderlay, _WidgetsInTemplateMixin,
    Grid, topic, request, dialogContent) {
    return declare([_WidgetBase, Dialog, _WidgetsInTemplateMixin], {
        topic: 'layerControl/showMetadata',
        templateString: dialogContent,
        style: 'width:500px;height:450px;',
        widgetsInTemplate: true,
        title: '',
        description: '',
        _setDescriptionAttr: {
            node: 'descriptionNode',
            type: 'innerHTML'
        },
        details: '',
        detailsTemplate: ['<ul style="padding:0 20px;"><li>ID: {id}</li>',
            '<li>Parent Layer: {parentLayer.name} ({parentLayer.id})</li>',
            '<li>Capabilities: {capabilities}</li>',
            '<li><a href="{url}" target="_blank">Metadata page</a></li>',
            '</ul>'
        ].join(''),
        _setDetailsAttr: {
            node: 'detailsNode',
            type: 'innerHTML'
        },
        fields: [],
        open: false,
        metadata: {
            name: ''
        },
        /**
         * initializes the widget's field grid and subscribes to the topic
         * `layerControl/showMetadata`
         */
        postCreate: function() {
            this.inherited(arguments);
            this.dgrid = new Grid({
                columns: {
                    name: 'Field',
                    alias: 'Name',
                    type: 'Type'
                }
            }, this.fieldsNode);
            topic.subscribe('layerControl/showMetadata', lang.hitch(this, '_fetchMetadata'));
        },
        /**
         * resize the tabcontainer when the dialog is resized
         */
        resize: function() {
            this.inherited(arguments);
            this.tabContainer.resize();
        },
        /**
         * fetches metadata from a published topic event where the topic
         * must have the following properties:
         *  - layer.url - the url to the layer's rest page `'.../Mapserver'`
         *  - subLayer.id - The sublayer id number
         * @param  {[type]} event [description]
         * @return {[type]}       [description]
         */
        _fetchMetadata: function(event) {
          var url  = event.layer.url + '/' + event.subLayer.id;
            new request({
                    url: url,
                    content: {
                        f: 'json'
                    }
                })
                .then(lang.hitch(this, '_showMetadata', url))
                .otherwise(lang.hitch(this, '_handleError'));
        },
        /**
         * Displays a given metadata using fields, name, and description
         * @param  {object} data The raw json object from a rest page
         */
        _showMetadata: function(url, data) {
          data.url = url;
            this.set({
                'title': data.name,
                description: data.description,
                fields: data.fields,
                details: lang.replace(this.detailsTemplate, data)
            });
            this.dgrid.renderArray(this.fields);
            this.show();
            //TODO: this causes an error when the dialog actually closes...
            //need to override this.hide() with a custom method
            // DialogUnderlay.hide();
        },
        /**
         * handles rest retrieval errors usually caused by not having a proxy or cors set up
         * @param  {Error} e The error
         */
        _handleError: function(e) {
            this._showMetadata({
                id: e,
                name: 'Error',
                description: 'The query could not execute. Is a proxy configured?'
            });
        }
    });
});
