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
    'dojo/topic',
    'dijit/CheckedMenuItem',
    'dijit/form/Button',
    'dijit/form/FilteringSelect',
    'dijit/form/ComboBox',
    'dijit/layout/TabContainer',
    'dijit/layout/ContentPane',
    'dijit/form/CheckBox'
], function(declare, _WidgetBase, _Templated, topic, lang, FeatureLayer, SimpleRenderer,
    domClass, Memory, request, LabelClass, TextSymbol, Color, templateString, i18n, topic, CheckedMenuItem) {


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

        // the map object
        map: null,

        // css class to add to menu icon (optional)
        cssClasses: ['fa', 'fa-font'],

        // default layer objects (optional )
        // example:
        // assets: { // layer id
        //    13: [{  // sublayer id
        //        name: 'Diameter - Material', //displayed to user
        //        value: '{diameter}" {material}' //label string
        //    }]
        defaultLabels: {},

        // the default topics
        topics: {
            show: 'layerControl/showLabelPicker'
        },

        // colors name is displayed to user, id is a valid dojo/Color string
        colors: [{
            name: 'Black',
            id: '#000'
        }, {
            name: 'White',
            id: '#fff'
        }, {
            name: 'Red',
            id: 'red'
        }, {
            name: 'Blue',
            id: 'blue'
        }, {
            name: 'Orange',
            id: '#ffb900'
        }, {
            name: 'Purple',
            id: 'purple'
        }, {
            name: 'Green',
            id: 'green'
        }, {
            name: 'Yellow',
            id: 'yellow'
        }],

        // default color id
        color: '#000',

        //default font size
        fontSize: 8,

        append: true,
        /**
         * The layer infos objects array, use the set method to update
         * @type {Array}
         */
        layerInfos: [],
        _setLayerInfosAttr: function(layerInfos) {
            this.layerInfos = layerInfos;
            if (!layerInfos.length) {
                return;
            }
            var store = this.layerStore;
            layerInfos.forEach(function(l) {
                if (l.layer.layerInfos) {
                    l.layer.layerInfos.filter(function(sub) {
                        return sub.subLayerIds === null;
                    }).forEach(function(sub) {
                        store.put({
                            id: l.layer.id + '_' + sub.id,
                            name: sub.name,
                            layer: l.layer,
                            sublayer: sub.id
                        });
                    });
                }
            });
        },
        activeLayer: {},
        _setActiveLayerAttr: function(l) {
            if (!l.layer || !l.sublayer) {
                return;
            }

            if (this.activeLayer === l) {
                return;
            }
            this.activeLayer = l;

            //reset the current field
            this.fieldSelect.set('value', null);

            // set default label select
            this.setDefaultLabels(this.activeLayer);

            // get the layer's fields
            var def = request({
                url: l.layer.url + '/' + l.sublayer,
                content: {
                    'f': 'json'
                }
            });
            def.then(lang.hitch(this, function(layerProps) {
                //update the field store
                var store = this.fieldStore;
                this.emptyStore(store);

                if (!layerProps.fields) {
                    return;
                }

                //exclude fields
                layerProps.fields.filter(function(f) {
                    return EXCLUDE_TYPES.indexOf(f.type) === -1;
                }).forEach(function(f) {
                    store.put({
                        id: f.name,
                        name: f.alias
                    });
                });
            }));
        },
        labelLayers: {},
        constructor: function() {
            this.inherited(arguments);

            this.defaultLabelStore = new Memory({
                data: []
            });

            this.fieldStore = new Memory({
                data: []
            });

            this.layerStore = new Memory({
                data: []
            });

            this.colorStore = new Memory({
                data: this.colors
            });
        },
        postCreate: function() {
            this.inherited(arguments);

            // topics we subscribe to
            topic.subscribe(this.topics.show, lang.hitch(this, 'showParent'));

            this.own(this.parentWidget.on('show', lang.hitch(this, function() {
                this.tabContainer.resize();
            })));

            this.own(this.layerSelect.on('change', lang.hitch(this, function(id) {
                var layer = this.layerStore.get(id);
                this.set('activeLayer', layer);
            })));

            this.colorSelect.set('value', this.color);

            this.own(this.fieldSelect.on('change', lang.hitch(this, function(id) {
                var str = ' {' + id + '}';
                this.labelTextbox.set('value', this.appendCheckbox.checked ? this.labelTextbox.value + str : str);
            })));

            this.own(this.defaultLabelSelect.on('change', lang.hitch(this, function(id) {
                if (!id) {
                    return;
                }
                this.labelTextbox.set('value', this.defaultLabelStore.get(id).value);
            })));

            //update labels when stuff changes
            var items = [this.colorSelect, this.labelTextbox, this.fontTextbox];
            items.forEach(lang.hitch(this, function(item) {
                this.own(item.on('change', lang.hitch(this, function() {
                    this.addSelectedLabels();
                })));

            }))


        },
        showParent: function(event) {

            // set dropdown values
            this.set('activeLayer', this.layerStore.get(event.layer.id + '_' + event.subLayer.id));
            this.layerSelect.set('value', event.layer.id + '_' + event.subLayer.id);

            // toggle parent
            if (this.parentWidget) {
                if (!this.parentWidget.open && this.parentWidget.toggle) {
                    this.parentWidget.toggle();
                } else if (this.parentWidget.show) {
                    this.parentWidget.show();
                    this.parentWidget.set('style', 'position: absolute; opacity: 1; left: 211px; top: 190px; z-index: 950;');
                }
            }
        },
        addSelectedLabels: function() {
            var layerId = this.activeLayer.id;
            if (!layerId) {
                return;
            }
            var layer;
            if (!this.labelLayers[layerId]) {

                var title = this.activeLayer.layer.layerInfos.filter(lang.hitch(this, function(l) {
                    return l.id === this.activeLayer.sublayer;
                }));
                title = title.length ? title[0].name + ' Labels' : 'Labels';

                var serviceURL = this.activeLayer.layer.url + '/' + this.activeLayer.sublayer;
                var layerOptions = {
                    mode: FeatureLayer.MODE_AUTO,
                    outFields: ['*'],
                    id: layerId,
                    visible: true,
                    title: title
                };
                layer = new FeatureLayer(serviceURL, layerOptions);
                this.labelLayers[layerId] = {
                    layer: layer,
                    iconNode: this.activeLayer.iconNode
                };
                this.map.addLayer(layer);

                // notify layer control and identify
                // wait for async layer loads
                layer.on('load', lang.hitch(this, function() {
                    ['layerControl/addLayerControls', 'identify/addLayerInfos'].forEach(function(t) {
                        topic.publish(t, [{
                            type: 'feature',
                            layer: layer,
                            title: title
                        }]);
                    });
                }));
            }

            layer = layer ? layer : this.labelLayers[layerId].layer;

            // var renderer = new SimpleRenderer(layer.renderer.getSymbol());
            var label = new LabelClass({
                labelExpressionInfo: {
                    value: this.labelTextbox.value
                },
                useCodedValues: true,
                labelPlacement: 'above-center'
            });
            var symbol = new TextSymbol();
            symbol.font.setSize(this.fontTextbox.value + 'pt');
            symbol.font.setFamily('Corbel');
            symbol.setColor(new Color(this.colorSelect.value.toLowerCase()));
            label.symbol = symbol;

            // layer.setRenderer(renderer);
            layer.setLabelingInfo([label]);
            layer.setVisibility(true);

            //modify the iconNode to show that a label is enabled on this layer
            var iconNode = this.labelLayers[layerId].iconNode;
            if (iconNode) {
                domClass.add(iconNode, this.cssClasses);
            }
        },
        setDefaultLabels: function(layer) {
            var layerId = layer.layer.id,
                sublayer = layer.sublayer,
                count = 1;
            if (this.defaultLabels[layerId] && this.defaultLabels[layerId][sublayer] && this.defaultLabels[layerId][sublayer].length) {
                this.emptyStore(this.defaultLabelStore);
                this.defaultLabels[layerId][sublayer].forEach(lang.hitch(this, function(labelObj) {
                    labelObj.id = count++;
                    this.defaultLabelStore.put(labelObj);
                }));
                this.defaultLabelSelect.set('value', 1);
                this.addSelectedLabels();
                this.tabContainer.selectChild(this.labelTab);
            } else {
                this.tabContainer.selectChild(this.advancedTab);
            }
        },
        /**
         * empties a store
         */
        emptyStore: function(store) {
            store.query().forEach(function(item) {
                store.remove(item.id);
            });
        }
    });
});
