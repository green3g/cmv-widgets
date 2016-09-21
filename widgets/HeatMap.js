/**
  * simple heatmap widget
  * credits to 
  * @bmadden and @ERS-Long
  * https://github.com/ERS-Long/HeatMap
  * 
  */

define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dojo/topic',
    'dojo/_base/lang',
    'esri/layers/FeatureLayer',
    'esri/renderers/HeatmapRenderer',
    'dojo/dom-class'
], function (declare, _WidgetBase, topic, lang, FeatureLayer, HeatmapRenderer, domClass) {
    return declare([_WidgetBase], {
        map: null,
        cssClasses: ['fa', 'fa-fire'],
        topic: 'layerControl/heatMap',
        colors: [
            'rgba(0,0,0,0.1)',
            'rgba(0,0,255,0.7)',
            'rgba(0,255,255,0.7)',
            'rgba(0,255,0,0.7)',
            'rgba(255,255,0,0.7)',
            'rgba(255,0,0,0.7)'
        ],
        _heatMapLayers: {},
        postCreate: function () {
            this.inherited(arguments);
            topic.subscribe(this.topic, lang.hitch(this, 'initHeatMap'));
        },
        initHeatMap: function (r) {
            var layerId = r.layer.id + r.subLayer.id;
            if (!this._heatMapLayers[r.layer.id]) {
                this._heatMapLayers[r.layer.id] = {};
            }
            if (!this._heatMapLayers[layerId]) {
                var serviceURL = r.layer.url + '/' + r.subLayer.id;
                var heatmapFeatureLayerOptions = {
                    mode: FeatureLayer.MODE_SNAPSHOT,
                    outFields: ['*'],
                    id: layerId
                };
                var heatmapRenderer = new HeatmapRenderer({
                    colors: this.colors
                });
                this._heatMapLayers[layerId] = new FeatureLayer(serviceURL, heatmapFeatureLayerOptions);
                this._heatMapLayers[layerId].setRenderer(heatmapRenderer);
                this.map.addLayer(this._heatMapLayers[layerId]);
            } else {
                //toggle visibility
                this._heatMapLayers[layerId].setVisibility(!this._heatMapLayers[layerId].visible);
            }
            //modify the iconNode to show that a heatmap is enabled on this layer
            if (r.iconNode) {
                if (domClass.contains(r.iconNode, 'fa-fire')) {
                    domClass.remove(r.iconNode, this.cssClasses);
                } else {
                    domClass.add(r.iconNode, this.cssClasses);
                }
            }
        }
    });
});
