define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'gis/dijit/_FloatingWidgetMixin',
    'dojo/dom-class',
    'dojo/_base/array',
    'dojo/_base/lang',
    'esri/request',
    'dojo/store/Memory',
    'dgrid/OnDemandGrid',
    'dgrid/extensions/ColumnHider',
    'dgrid/extensions/DijitRegistry',
    'dijit/layout/TabContainer',
    'xstyle/css!./RelatedRecordTable/css/styles.css',
    'dojo/text!./RelatedRecordTable/templates/RelatedRecordTable.html',
    'dojo/domReady!'
], function (declare, _WidgetBase, _TemplatedMixin, _FloatingWidgetMixin, DomClass,
        Array, Lang, Request, Memory, OnDemandGrid, ColumnHider,
        DijitRegistry, TabContainer, css, tableTemplate) {
    var customGrid = declare('customGrid', [OnDemandGrid, ColumnHider, DijitRegistry]);
    return declare('RelatedRecordTable', [_WidgetBase, _TemplatedMixin, _FloatingWidgetMixin], {
        templateString: tableTemplate,
        relationshipLayers: null,
        formatters: null,
        tabPosition: 'left-h',
        columnInfos: {},
        baseClass: 'relatedRecordTableWidget',
        constructor: function () {
            this.relationshipLayers = [];
            this.formatters = {};
        },
        postCreate: function () {
            this.inherited(arguments);
            if (this.hasOwnProperty('parentWidget')) {
                DomClass.add(this.parentWidget.id, 'RelatedRecordsTableParent ' + this.tabPosition);
            }

            this.tabContainer = new TabContainer({
                tabPosition: this.tabPosition,
                style: 'height:100%;width:100%;',
                doLayout: false
            }, this.containerNode);
            var self = this;
            Array.forEach(this.layerInfos, Lang.hitch(this, function (layerInfo) {
                if (layerInfo.layer.relationships && layerInfo.layer.relationships.length > 0) {
                    var relationshipLayer = {
                        layer: layerInfo.layer,
                        relationships: []
                    };
                    Array.forEach(layerInfo.layer.relationships, Lang.hitch(this, function (relationshipInfo) {
                        var relationship = {
                            relationship: relationshipInfo,
                            title: layerInfo.layer.name + '-' + relationshipInfo.name,
                            formatters: {},
                            hiddenColumns: [],
                            unhideableColumns: [],
                            include: true,
                            grid: null,
                            store: null
                        };
                        if (this.columnInfos.hasOwnProperty(layerInfo.layer.id) &&
                                this.columnInfos[layerInfo.layer.id].hasOwnProperty(relationshipInfo.id)) {
                            declare.safeMixin(
                                    relationship,
                                    this.columnInfos[layerInfo.layer.id][relationshipInfo.id]);
                        }
                        if (relationship.include) {
                            relationship.store = new Memory({
                                id: relationshipLayer.layer.objectIdField
                            });
                            relationship.grid = new customGrid({
                                title: relationship.title,
                                store: relationship.store,
                                noDataMessage: 'Click a feature from the map to find related records'
                            });
                            relationshipLayer.relationships.push(relationship);
                            this.tabContainer.addChild(relationship.grid);
                        }

                    }));
                    relationshipLayer.layer.on('click', Lang.hitch(this, function (clickEvent) {
                        this._onLayerClick(relationshipLayer, clickEvent);
                    }));
                    this.relationshipLayers.push(relationshipLayer);
                }
            }));
        },
        onShow: function () {
            this.inherited(arguments);
            this.tabContainer.resize();
        },
        startup: function () {
            this.inherited(arguments);
            this.tabContainer.startup();
            this.tabContainer.resize();
        },
        _onLayerClick: function (layer, clickEvent) {
            Array.forEach(layer.relationships, Lang.hitch(this, function (relationship) {
                if (relationship.include) {
                    relationship.store.setData([]);
                    relationship.grid.refresh();
                    var attributes = clickEvent.graphic.attributes;
                    var objectID = attributes[layer.layer.objectIdField];
                    var query = {
                        url: layer.layer.url,
                        objectIds: [objectID],
                        outFields: ['*'],
                        relationshipId: relationship.relationship.id
                    };
                    this._queryRelatedRecords(query, Lang.hitch(this, function (fields, recordGroups) {
                        if (!relationship.grid.get('columns').length) {
                            relationship.grid.set('columns', Array.map(fields, Lang.hitch(this, function (field) {
                                var formatter = relationship.formatters[field.name] ||
                                        relationship.formatters[field.type] ||
                                        this.formatters[field.name] ||
                                        this.formatters[field.type] || null;
                                return {
                                    label: field.alias,
                                    field: field.name,
                                    formatter: formatter,
                                    hidden: relationship.hiddenColumns.indexOf(field.name) !== -1,
                                    unhidable: relationship.unhideableColumns.indexOf(field.name) !== -1
                                };
                            })));
                        }
                        if (recordGroups.length > 0) {
                            Array.forEach(recordGroups[0].relatedRecords, function (record) {
                                relationship.store.put(record.attributes);
                            });
                        }
                        relationship.grid.refresh();
                    }));
                }
            }
            ));
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
            new Request({
                url: query.url + '/queryRelatedRecords',
                content: {
                    returnGeometry: false,
                    objectIDs: query.objectIds,
                    outFields: query.outFields,
                    relationshipId: query.relationshipId,
                    f: 'json'
                },
                handleAs: 'json'
            }).then(function (response) {
                callback(response.fields, response.relatedRecordGroups);
            });
        }
    });
});
