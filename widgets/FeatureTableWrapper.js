define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/_base/array',
    'dojo/_base/lang',
    'esri/dijit/FeatureTable',
    'esri/layers/FeatureLayer',
    'esri/tasks/QueryTask',
    'esri/tasks/query',
    'dojo/dom-class',
    'xstyle/css!./FeatureTableWrapper/css/style.css'
], function (declare, _WidgetBase, _TemplatedMixin, array, lang, FeatureTable, FeatureLayer, QueryTask, Query, domClass) {
    return declare([_WidgetBase, _TemplatedMixin], {
        tableOptions: {},
        layerId: '',
        templateString: '<div style="height:100%;width:100%;"><div id="featureTableNode" data-dojo-attach-point="featureTableNode"></div></div>',
        postCreate: function () {
            this.inherited(arguments);
            domClass.add(this.parentWidget.domNode, 'featureTableWidget');
            array.forEach(this.layerInfos, lang.hitch(this, function (layerInfo) {
                if (this.layerId === layerInfo.layer.id) {
                    this.fl = layerInfo.layer;
                }
            }));
            this.tableOptions = lang.mixin({
                map: this.map,
                featureLayer: this.fl,
                allowSelectAll: true,
                dateOptions: {
                    timeEnabled: false,
                    datePattern: 'YYYY-MM-DD'
                }
            }, this.tableOptions);
        },
        startup: function () {
            this.inherited(arguments);
            this.ft = new FeatureTable(this.tableOptions, 'featureTableNode');
            this.ft.on('dgrid-select', lang.hitch(this, '_centerOnSelection'));
            this.fl.on("click", lang.hitch(this, '_selectFromGrid'));
            this.ft.startup();

        },
        _centerOnSelection: function (e) {
            this._removeHighlight();
            // select the feature
            var query = new Query();
            query.objectIds = array.map(e, lang.hitch(this, function (row) {
                return parseInt(row.id);
            }));
            this.fl.selectFeatures(query, FeatureLayer.SELECTION_NEW, lang.hitch(this, function (result) {
                if (result.length) {
                    // re-center the map to the selected feature
                    this.map.centerAt(result[0].geometry.getExtent().getCenter());
                } else {
                    //console.log("Feature Layer query returned no features... ", result);
                }
            }));
        },
        _selectFromGrid: function (e) {
            this.ft.grid.clearSelection();
            this._removeHighlight();
            var id = e.graphic.attributes.OBJECTID;
            // select the feature that was clicked
            var query = new Query();
            query.objectIds = [id];

            this.fl.selectFeatures(query, FeatureLayer.SELECTION_NEW);
            // highlight the corresponding row in the grid
            // and make sure it is in view
            this.selectedElement = this.ft.grid.row(id).element;
            this.selectedElement.scrollIntoView();
            domClass.add(this.selectedElement, 'highlighted');
        },
        resize: function () {
            this.inherited(arguments);
            this.ft.resize();
        },
        _removeHighlight: function () {
            if (this.selectedElement) {
                domClass.remove(this.selectedElement, 'highlighted');
            }
        }

    });
});