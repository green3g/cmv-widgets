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
    'dijit/registry',
    'dojo/ready',
    'dijit/layout/TabContainer',
    'xstyle/css!./RelatedRecordTable/css/styles.css',
    'dojo/domReady!'
], function (declare, _WidgetBase, _TemplatedMixin, _FloatingWidgetMixin, DomClass,
        Array, Lang, Request, Memory, OnDemandGrid, ColumnHider,
        RegistryMixin, registry, ready, TabContainer) {
    var CustomGrid = declare('customGrid', [OnDemandGrid, ColumnHider, RegistryMixin]);
    return declare('RelatedRecordTable', [_WidgetBase, _TemplatedMixin, _FloatingWidgetMixin], {
        templateString: '<div class="${baseClass}" style="height:100%;width:100%;"><div data-dojo-attach-point="containerNode"></div></div>',
        relationshipLayers: null,
        formatters: null,
        tabPosition: 'left-h',
        columnInfos: {},
        baseClass: 'relatedRecordTableWidget',
        //this id can be the dijit id of a tabcontainer or
        //a widget that has a tabContainer property, like tmgee's attribute
        //table widget
        tabContainerId: null,
        constructor: function () {
            this.relationshipLayers = [];
            this.formatters = {};
        },
        postCreate: function () {
            this.inherited(arguments);
            if (this.tabContainerId) {
                ready(10, this, '_init');
            } else {
                if (this.hasOwnProperty('parentWidget')) {
                    DomClass.add(this.parentWidget.id, 'RelatedRecordsTableParent ' + this.tabPosition);
                }
                this.tabContainer = new TabContainer({
                    tabPosition: this.tabPosition,
                    style: 'height:100%;width:100%;',
                    doLayout: false
                }, this.containerNode);
                this._init();
            }
        },
        _init: function () {
            if (!this.tabContainer) {
                this.tabContainer = registry.byId(this.tabContainerId);
                //allow user to reference a widget with a tab container by id
                if(this.tabContainer.hasOwnProperty('tabContainer')){
                    this.tabContainer = this.tabContainer.tabContainer;
                }
            }
            if(!this.tabContainer){
                return;
            }
            if (this.layerInfos.length > 0) {
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
                                relationship.grid = new CustomGrid({
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
            }
        },
        _onLayerClick: function (layer, clickEvent) {
            Array.forEach(layer.relationships, Lang.hitch(this, function (relationship) {
                if (relationship.include) {
                    relationship.store.setData([]);
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
        },
        _initMapClick: function () {
            this.layerInfos[0].layer.getMap().on('click', Lang.hitch(this, function () {
                Array.forEach(this.relationshipLayers, Lang.hitch(this, function (relationshipLayer) {
                    Array.forEach(relationshipLayer.relationships, Lang.hitch(this, function (relationship) {
                        if (relationship.include) {
                            relationship.store.setData([]);
                            relationship.grid.refresh();
                        }
                    }));
                }));
            }));
        }
    });
});
