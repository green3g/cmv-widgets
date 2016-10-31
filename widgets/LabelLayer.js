

define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_Templated',
    'dojo/topic',
    'dojo/_base/lang',
    'esri/layers/FeatureLayer',
    'esri/renderers/SimpleRenderer',
    'dojo/dom-class',
    'dojo/store/Memory',
    'esri/request',
    'esri/layers/LabelClass',
    'esri/symbols/TextSymbol',
    'esri/Color',
    'dojo/text!./LabelLayer/templates/LabelLayer.html',
    'dojo/i18n!./LabelLayer/nls/LabelLayer',
    'dijit/form/Button',
    'dijit/form/FilteringSelect'
], function (declare, _WidgetBase, _Templated, topic, lang, FeatureLayer, SimpleRenderer,
  domClass, Memory, request, LabelClass, TextSymbol, Color, templateString, i18n) {


    var EXCLUDE_TYPES = [
        'esriFieldTypeBlob',
        'esriFieldTypeGeometry',
        'esriFieldTypeRaster',
        'esriFieldTypeGUID',
        'esriFieldTypeGlobalID'
    ];


    return declare([_WidgetBase, _Templated], {
        templateString: templateString,
        widgetsInTemplate: true,
        i18n: i18n,
        map: null,
        cssClasses: ['fa', 'fa-font'],
        topic: 'layerControl/labels',
        colors: [
            'rgba(0,0,0,0.1)',
            'rgba(0,0,255,0.7)',
            'rgba(0,255,255,0.7)',
            'rgba(0,255,0,0.7)',
            'rgba(255,255,0,0.7)',
            'rgba(255,0,0,0.7)'
        ],
        /**
         * The layer infos objects array, use the set method to update
         * @type {Array}
         */
        layerInfos: [],
        _setLayerInfosAttr: function (layerInfos) {
            this.layerInfos = layerInfos;
            if (!layerInfos.length) {
                return;
            }
            var store = this.layerStore;
            layerInfos.forEach(function (l) {
                l.layer.layerInfos.filter(function (sub) {
                    return sub.subLayerIds === null;
                }).forEach(function (sub) {
                    store.put({
                        id: l.layer.id + '_' + sub.id,
                        name: sub.name,
                        layer: l.layer,
                        sublayer: sub.id
                    });
                });
            });
        },
        activeLayer: {},
        _setActiveLayerAttr: function (l) {
            this.activeLayer = l;
            if (!l.layer || !l.subLayer) {
                return;
            }
            var def = request({
                url: l.layer.url + '/' + l.subLayer.id,
                content: {
                    'f': 'json'
                }
            });
            def.then(lang.hitch(this, function (layerProps) {
              //update the field store
                var store = this.fieldStore;
                this.emptyStore(store);

                if (!layerProps.fields) {
                    return;
                }

              //exclude fields
                layerProps.fields.filter(function (f) {
                    return EXCLUDE_TYPES.indexOf(f.type) === -1;
                }).forEach(function (f) {
                    store.put({
                        id: f.name,
                        name: f.alias
                    });
                });
            }));
        },
        activeField: null,
        _labelLayers: {},
        constructor: function () {
            this.inherited(arguments);

            this.fieldStore = new Memory({
                data: []
            });

            this.layerStore = new Memory({
                data: []
            });
        },
        postCreate: function () {
            this.inherited(arguments);
            topic.subscribe(this.topic, lang.hitch(this, 'handleTopic'));

            this.own(this.layerSelect.on('change', lang.hitch(this, function (id) {
                var layer = this.layerStore.get(id);
                this.set('activeLayer', {
                    layer: layer.layer,
                    subLayer: {id: layer.sublayer}
                });
            })));

            this.own(this.fieldSelect.on('change', lang.hitch(this, function (id) {
                this.set('activeField', id);
            })));
        },
        handleTopic: function (event) {
            this.set('activeLayer', event);
            if (this.parentWidget) {
                if (!this.parentWidget.open && this.parentWidget.toggle) {
                    this.parentWidget.toggle();
                } else if (this.parentWidget.show) {
                    this.parentWidget.show();
                    this.parentWidget.set('style', 'position: absolute; opacity: 1; left: 211px; top: 190px; z-index: 950;');
                }
            }
            this.layerSelect.set('value', event.layer.id + '_' + event.subLayer.id);
        },
        addLabels: function () {
            var layerId = this.activeLayer.layer.id + this.activeLayer.subLayer.id;
            if (!this._labelLayers[layerId]) {
                var serviceURL = this.activeLayer.layer.url + '/' + this.activeLayer.subLayer.id;
                var layerOptions = {
                    mode: FeatureLayer.MODE_ONDEMAND,
                    outFields: [this.activeField],
                    id: layerId,
                    visible: true
                };
                var renderer = new SimpleRenderer({
                    colors: this.colors
                });
                var label = new LabelClass({
                    labelExpressionInfo: {value: '{' + this.activeField + '}'},
                    useCodedValues: true,
                    labelPlacement: 'above-center'
                });
                var symbol = new TextSymbol();
                symbol.font.setSize('10pt');
                symbol.font.setFamily('Corbel');
                symbol.setColor(new Color('#666'));
                label.symbol = symbol;

                this._labelLayers[layerId] = {layer: new FeatureLayer(serviceURL, layerOptions), iconNode: this.activeLayer.iconNode};
                // this._labelLayers[layerId].layer.setRenderer(renderer);
                this._labelLayers[layerId].layer.setLabelingInfo([label]);
                this.map.addLayer(this._labelLayers[layerId].layer);
            } else {
                //toggle visibility
                this.map.removeLayer(this._labelLayers[layerId].layer);
            }
            //modify the iconNode to show that a label is enabled on this layer
            var iconNode = this._labelLayers[layerId].iconNode;
            if (iconNode) {
                if (domClass.contains(iconNode, 'fa-font')) {
                    domClass.remove(iconNode, this.cssClasses);
                    this._labelLayers[layerId].layer = null;
                } else {
                    domClass.add(iconNode, this.cssClasses);
                }
            }
        },
        /**
         * empties a store
         */
        emptyStore: function (store) {
            store.query().forEach(function (item) {
                store.remove(item.id);
            });
        }
    });
});
