define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dojo/dom-class',
    'dojo/_base/array',
    'dojo/_base/lang',
    'esri/request',
    'dojo/store/Memory',
    'dgrid/OnDemandGrid',
    'dgrid/extensions/ColumnHider',
    'dojo/topic',
    'dojo/Deferred'
], function (declare, _WidgetBase, DomClass,
        array, lang, request, Memory, OnDemandGrid, ColumnHider, topic, Deferred) {
    return declare('RelatedRecordTable', [_WidgetBase, OnDemandGrid, ColumnHider], {
        formatters: null,
        columnInfos: {},
        //this id can be the dijit id of a tabcontainer or
        //a widget that has a tabContainer property, like tmgee's attribute
        //table widget
        tabContainerId: null,
        postCreate: function () {
            this.inherited(arguments);
            console.log(this);
            this.store = new Memory({
                idProperty: this.objectIdField
            });
            if (this.attributes) {
                this.getRelatedRecords(this.attributes);
            }
        },
        getRelatedRecords: function (attributes) {
            this.store.setData([]);
            var objectID = attributes[this.objectIdField];
            var query = {
                url: this.url,
                objectIds: [objectID],
                outFields: ['*'],
                relationshipId: this.relationshipId
            };
            var deferred = this._queryRelatedRecords(query);
            deferred.then(lang.hitch(this, '_handleRecords'));
            return deferred;
        },
        _handleRecords: function (results) {
            console.log(results);
            //if we don't have columns set yet
            if (!this.get('columns').length) {
                this.set('columns', array.map(results.fields, lang.hitch(this, function (field) {
                    return {
                        label: field.alias,
                        field: field.name
                    };
                })));
            }
            if (results.relatedRecordGroups.length > 0) {
                array.forEach(results.relatedRecordGroups[0].relatedRecords, lang.hitch(this, '_addRecord'));
            }
            this.refresh();
        },
        _addRecord: function(record){
            this.store.put(record.attributes);
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
        _queryRelatedRecords: function (query) {
            var deferred = new Deferred();
            new request({
                url: query.url + '/queryRelatedRecords',
                content: {
                    returnGeometry: false,
                    objectIDs: query.objectIds,
                    outFields: query.outFields,
                    relationshipId: query.relationshipId,
                    f: 'json'
                },
                handleAs: 'json',
                load: function (result) {
                    deferred.resolve(result);
                },
                error: function (error) {
                    console.log(error);
                }
            });
            return deferred;
        }
    });
});
