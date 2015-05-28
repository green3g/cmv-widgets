define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/ready',
    'dijit/registry',
    'dijit/_Container',
    'dijit/layout/TabContainer',
    'dojo/topic',
    './RelatedRecordTable/RelationshipTable',
    'xstyle/css!./RelatedRecordTable/css/styles.css'
], function (declare, _WidgetBase, _TemplatedMixin,
        array, lang, ready, registry, _Container, TabContainer, topic, RelationshipTable) {
    return declare('RelatedRecordTable', [_WidgetBase, _Container], {
        templateString: '<div class="${baseClass}" style="height:100%;width:100%;"><div data-dojo-attach-point="containerNode"></div></div>',
        tabPosition: 'left-h',
        relationships: {},
        baseClass: 'relatedRecordTableWidget',
        //this id can be the dijit id of a tabcontainer or
        //a widget that has a tabContainer property, like tmgee's attribute
        //table widget
        tabContainerId: null,
        postCreate: function () {
            this.inherited(arguments);
            if (this.tabContainerId) {
                ready(10, this, '_init');
            } else {
                this.tabContainer = new TabContainer({
                    tabPosition: this.tabPosition,
                    style: 'height:100%;width:100%;'
                });
                this.addChild(this.tabContainer);
                this._init();
            }
        },
        startup: function () {
            this.inherited(arguments);
            if (!this.tabContainer._started) {
                this.tabContainer.startup();
            }
        },
        resize: function() {
            this.inherited(arguments);
            this.tabContainer.resize();
        },
        _init: function () {
            if (!this.tabContainer) {
                this.tabContainer = registry.byId(this.tabContainerId);
                //allow user to reference a widget with a tab container by id
                if (this.tabContainer && this.tabContainer.hasOwnProperty('tabContainer')) {
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
                array.forEach(this.layerInfos, lang.hitch(this, function (l) {
                    array.forEach(l.layer.relationships, lang.hitch(this, function (r) {
                        if (l.layer.relationships &&
                                l.layer.relationships.length > 0 &&
                                this.relationships[l.layer.id] &&
                                this.relationships[l.layer.id][r.id]) {
                            var table = new RelationshipTable(lang.mixin({
                                title: l.layer.title + ' - ' + r.name,
                                url: l.layer.url,
                                relationshipId: r.id,
                                objectIdField: l.layer.objectIdField
                            }, this.relationships[l.layer.id][r.id]));
                            this.tabContainer.addChild(table);
                            this.tabContainer.resize();
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
