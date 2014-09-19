define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'gis/dijit/_FloatingWidgetMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/_base/array',
    'dojo/_base/lang',
    'esri/request',
    'dojo/store/Memory',
    'dgrid/OnDemandGrid',
    'dgrid/extensions/ColumnHider',
    'dijit/layout/TabContainer',
    'dijit/layout/ContentPane',
    'xstyle/css!./RelatedRecordTable/css/styles.css',
    'dojo/domReady!'
], function (declare, _WidgetBase, _TemplatedMixin, _FloatingWidgetMixin, _WidgetsInTemplateMixin,
        Array, Lang, Request, Memory, OnDemandGrid, ColumnHider,
        TabContainer, ContentPane, css) {
    var customGrid = declare('customGrid', [OnDemandGrid, ColumnHider]);
    return declare('RelatedRecordTable', [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _FloatingWidgetMixin], {
        templateString:
                '<div class="${baseClass}">' +
                '<div data-dojo-type="dijit/layout/TabContainer" data-dojo-props="doLayout:false" data-dojo-attach-point="tabContainer">' +
                '</div>' +
                '</div>',
        relationshipLayers: null,
        formatters: null,
        hiddenColumns: null,
        unhideableColumns: null,
        constructor: function () {
            this.relationshipLayers = [];
            this.hiddenColumns = [];
            this.unhideableColumns = [];
            this.formatters = {};

        },
        postCreate: function () {
            this.inherited(arguments);

            Array.forEach(this.layerInfos, Lang.hitch(this, function (layerInfo) {
                if (layerInfo.layer.relationships && layerInfo.layer.relationships.length > 0) {
                    this.relationshipLayers.push(layerInfo.layer);
                }
            }));

            Array.forEach(this.relationshipLayers, Lang.hitch(this, function (layer) {
                Array.forEach(layer.relationships, Lang.hitch(this, function (relationship) {
                    relationship.contentPane = new ContentPane({
                        title: relationship.name,
                        id: layer.id + '-' + relationship.name + 'Grid',
                        style: 'height:300px;width:100%;',
                        content: ''
                    });
                    //this.tabContainer.layout();
                    relationship.store = new Memory({
                        id: layer.objectIdField
                    });
                    relationship.grid = new customGrid({
                        store: relationship.store
                    });
                    this.tabContainer.addChild(relationship.contentPane);
                    relationship.contentPane.addChild(relationship.grid);

                    layer.on('click', Lang.hitch(this, function (clickEvent) {
                        this._onLayerClick(layer, clickEvent);
                    }));
                }));
            }));
        },
        _onLayerClick: function (layer, clickEvent) {
            var relationship = layer.relationships[0];
            var attributes = clickEvent.graphic.attributes;
            var objectID = attributes[layer.objectIdField];
            var query = {
                url: layer.url,
                objectIds: [objectID],
                outFields: ['*'],
                relationshipId: relationship.id
            };
            this._queryRelatedRecords(query, Lang.hitch(this, function (fields, recordGroups) {
                if (!relationship.grid.get('columns').length) {
                    relationship.grid.set('columns', Array.map(fields, Lang.hitch(this, function (field) {
                        return {
                            label: field.alias,
                            field: field.name,
                            formatter: this.formatters[field.name] ||
                                    this.formatters[field.type] || null,
                            hidden: this.hiddenColumns.indexOf(field.name) !== -1,
                            unhidable: this.unhideableColumns.indexOf(field.name) !== -1
                        };
                    })));
                }
                relationship.store.setData([{}]);
                if (recordGroups.length > 0) {
                    Array.forEach(recordGroups[0].relatedRecords, function (record) {
                        relationship.store.put(record.attributes);
                    });
                }
                relationship.grid.refresh();
            }));
        },
        /*
         * custom queryRelatedRecords function
         * layer.queryRelatedRecords doesn't return the field 
         * properties such as alias.    
         * @param {object} query - object with the query properties
         * @param function callback - function(responseFields, relatedRecordGroups)
         * query properties:
         *  - url: the url of the featureLayer
         *  - objectIds: [object IDs]
         *  - outFields: ['*'],
         *  - relationshipId: integer
         */
        _queryRelatedRecords: function (query, callback) {
            query.f = 'json'
            new Request({
                url: query.url + '/queryRelatedRecords?',
                content: query,
                handleAs: 'json'
            }).then(function (response) {
                callback(response.fields, response.relatedRecordGroups);
            });
        }
    });
});
