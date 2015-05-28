define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
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
    'dojo/topic',
    './RelatedRecordTable/RelationshipTable',
    'xstyle/css!./RelatedRecordTable/css/styles.css'
], function (declare, _WidgetBase, _TemplatedMixin, DomClass,
        Array, lang, Request, Memory, OnDemandGrid, ColumnHider,
        RegistryMixin, registry, ready, TabContainer, topic, RelationshipTable) {
    var CustomGrid = declare('customGrid', [OnDemandGrid, ColumnHider, RegistryMixin]);
    return declare('RelatedRecordTable', [_WidgetBase, _TemplatedMixin], {
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
                this.tabContainer.startup();
                this._init();
            }
        },
        _init: function () {
            if (!this.tabContainer) {
                this.tabContainer = registry.byId(this.tabContainerId);
                //allow user to reference a widget with a tab container by id
                if (this.tabContainer.hasOwnProperty('tabContainer')) {
                    this.tabContainer = this.tabContainer.tabContainer;
                }
            }
            if (!this.tabContainer) {
                topic.publish('viewer/handleError', {
                    source: 'RelatedRecordTable',
                    error: 'tab container could not be found'
                });
                return;
            }
            if (this.layerInfos.length > 0) {
                Array.forEach(this.layerInfos, lang.hitch(this, function (l) {
                    Array.forEach(l.layer.relationships, lang.hitch(this, function (r) {
                        if (l.layer.relationships &&
                                l.layer.relationships.length > 0 &&
                                this.relationships[l.layer.id] &&
                                this.relationships[l.layer.id].include) {
                            var table = new RelationshipTable(lang.mixin({
                                title: l.layer.title + ' - ' + r.name,
                                url: l.layer.url,
                                relationshipId: r.id,
                                objectIdField: l.objectIdField
                            }, this.columnInfos[l.layer.id][r.id]));
                            this.tabContainer.addChild(table);
                            l.layer.on('click', lang.hitch(this, function (e) {
                                table.getRelatedRecords(e.graphic.attributes);
                            }));
                        }
                    }));
                }));
            }
        }
    });
});
