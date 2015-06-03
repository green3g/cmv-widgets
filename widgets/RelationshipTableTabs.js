define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/ready',
    'dijit/registry',
    'dijit/_Container',
    'dijit/layout/TabContainer',
    'dojo/topic',
    './RelationshipTable/RelationshipTable'
], function (declare, _WidgetBase, array, lang, ready, registry, _Container, TabContainer, topic, RelationshipTable) {
    return declare('RelationshipTableTabs', [_WidgetBase, _Container], {
        //tab position for the TabContainer
        tabPosition: 'top',
        //optional relationships information
        relationships: {},
        //dom element class
        baseClass: 'RelationshipTableTabs',
        //this id can be the dijit id of a tabcontainer or
        //a widget that has a tabContainer property, like tmgee's attribute table widget
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
                this.tabContainer.startup();
                this._init();
            }
        },
        resize: function () {
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
                                l.layer.relationships.length > 0) {
                            var props = {
                                title: l.layer.name + ' - ' + r.name,
                                url: l.layer.url,
                                objectIdField: l.layer.objectIdField,
                                relationshipId: r.id
                            };
                            if (this.relationships[l.layer.id] &&
                                    this.relationships[l.layer.id][r.id]) {
                                if (this.relationships[l.layer.id][r.id].exclude) {
                                    return;
                                }
                                props = lang.mixin(props, this.relationships[l.layer.id][r.id]);
                            }
                            var table = new RelationshipTable(props);
                            this.tabContainer.addChild(table);
                            l.layer.on('click', lang.hitch(this, function (e) {
                                table.getRelatedRecords(e.graphic.attributes);
                            }));
                        }
                    }));
                }));
            }
            this.resize();
        }
    });
});
