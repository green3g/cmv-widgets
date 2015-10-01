define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dojo/_base/array',
  'dojo/_base/lang',
  'esri/request',
  'dojo/store/Memory',
  'dgrid/OnDemandGrid',
  'dgrid/extensions/ColumnHider',
  'dgrid/extensions/DijitRegistry',
  'dojo/topic',
  'dojo/Deferred'
], function(declare, _WidgetBase, array, lang, request, Memory, OnDemandGrid, ColumnHider, DijitRegistry, topic, Deferred) {
  return declare('RelationshipTable', [_WidgetBase, OnDemandGrid, ColumnHider, DijitRegistry], {
    //object id field for the feature layer (use field alias)
    objectIdField: null,
    //field value mappings of attributes from the feature layer to query related records from
    //should have a field with the same name as objetIdField
    attributes: null,
    //the url to the feature service
    url: '',
    //the relationship id for the feature service relationship
    relationshipId: 0,
    //default message to display when no results are returned
    defaultNoDataMessage: 'No results.',
    //default error message
    errorDataMessage: 'The query could not be executed. Is a proxy configured?',
    //default message when the query is being executed
    loadingMessage: 'Loading...',
    baseClass: 'RelationshipTable',
    postCreate: function() {
      this.inherited(arguments);
      if (!this.objectIdField) {
        topic.publish('viewer/handleError', {
          source: 'RelationshipTable',
          error: 'This widget requires an objetIdField'
        });
        this.destroy();
      }
      this.store = new Memory({
        idProperty: this.objectIdField
      });
      this.noDataMessage = this.defaultNoDataMessage;
      if (this.attributes) {
        this.getRelatedRecords(this.attributes);
      }
    },
    getRelatedRecords: function(attributes) {
      if (this.deferred) {
        this.deferred.cancel();
      }
      //reset the grid's data
      this.store.setData([]);
      this.noDataMessage = this.loadingMessage;
      this.refresh();
      //get the objectID
      var objectID = attributes[this.objectIdField];
      if (!objectID) {
        topic.publish('viewer/handleError', {
          source: 'RelationshipTable',
          error: this.objectIdField + ' ObjectIDField was not found in attributes'
        });
        return;
      }
      //build a query
      var query = {
        url: this.url,
        objectIds: [objectID],
        outFields: ['*'],
        relationshipId: this.relationshipId
      };
      this.deferred = this._queryRelatedRecords(query);
      this.deferred
        .then(lang.hitch(this, '_handleRecords'))
        .otherwise(lang.hitch(this, '_handleError'));
      return this.deferred.promise;
    },
    _handleRecords: function(results) {
      this.deferred = null;
      this.noDataMessage = this.defaultNoDataMessage;
      //if we don't have columns set yet
      if (!this.get('columns').length) {
        this.set('columns', array.map(results.fields, lang.hitch(this, function(field) {
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
    _handleError: function(e) {
      this.noDataMessage = this.errorDataMessage;
      this.refresh();
    },
    _addRecord: function(record) {
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
    _queryRelatedRecords: function(query) {
      var deferred = new request({
        url: query.url + '/queryRelatedRecords',
        content: {
          returnGeometry: false,
          objectIDs: query.objectIds,
          outFields: query.outFields,
          relationshipId: query.relationshipId,
          f: 'json'
        },
        handleAs: 'json'
      });
      return deferred;
    },
    destroy: function() {
      if (this.deferred) {
        this.deferred.cancel();
        this.deferred = null;
      }
      this.inherited(arguments);
    },
    resize: function() {
      this.inherited(arguments);
    }
  });
});
