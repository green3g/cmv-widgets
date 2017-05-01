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
    'esri/Color',
    'dojo/text!./templates/LabelPicker.html',
    'dojo/i18n!./nls/LabelPicker',
    'dijit/CheckedMenuItem',
    'dijit/form/Button',
    'dijit/form/FilteringSelect',
    'dijit/form/ComboBox',
    'dijit/layout/TabContainer',
    'dijit/layout/ContentPane',
    'dijit/form/CheckBox'
], function (declare, _WidgetBase, _Templated, topic, lang, FeatureLayer, SimpleRenderer,
    domClass, Memory, request, Color, templateString, i18n) {


    var EXCLUDE_TYPES = [
        'esriFieldTypeBlob',
        'esriFieldTypeGeometry',
        'esriFieldTypeRaster',
        'esriFieldTypeGUID',
        'esriFieldTypeOID',
        'esriFieldTypeGlobalID'
    ];

    return declare([_WidgetBase, _Templated], {
        templateString: templateString,
        widgetsInTemplate: true,
        i18n: i18n,

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

        activeLayer: {},
        _setActiveLayerAttr: function (l) {
            if (!l.layer) {
                return;
            }

            if (this.activeLayer === l) {
                return;
            }
            this.activeLayer = l;

            //reset the current field
            this.emptyStore(this.fieldStore);
            this.fieldSelect.set('value', null);

            // set default label select
            this.setLabelSelections(this.activeLayer);


            var fields;
            // if fields are provided use those
            if (this.labelInfos.hasOwnProperty(l.layer.id) &&
                this.labelInfos[l.layer.id].hasOwnProperty(l.sublayer) &&
                this.labelInfos[l.layer.id][l.sublayer].fields) {
                fields = this.labelInfos[l.layer.id][l.sublayer].fields;
                this._setFields(fields);
            } else {

                // display a spinner
                this.set('fieldsLoading', true);

                // get the layer's fields
                var def = request({
                    url: l.layer.url + (l.sublayer ? '/' + l.sublayer : ''),
                    content: {
                        'f': 'json'
                    }
                });
                def.then(lang.hitch(this, function (layerProps) {

                    if (!layerProps.fields) {
                        return;
                    }

                    // otherwise use the rest service results
                    // exclude esri object id types
                    fields = layerProps.fields.filter(function (f) {
                        return EXCLUDE_TYPES.indexOf(f.type) === -1;
                    });
                    this._setFields(fields);
                    this.set('fieldsLoading', false);

                }));
            }
        },
        _setFields: function (fields) {

            fields.forEach(lang.hitch(this, function (f) {
                this.fieldStore.put({
                    id: f.name,
                    name: f.alias
                });
            }));
        },
        /**
         * Display a field loading spinner
         * set using `this.set('fieldsLoading', true)`
         * @type {Boolean} fieldsLoading
         */
        fieldsLoading: false,
        _setFieldsLoadingAttr: function (loading) {
            this.fieldsLoading = loading;
            domClass[loading ? 'remove' : 'add'](this.fieldSpinner, 'dijitHidden');
        },
        labelLayers: {},
        constructor: function () {
            this.inherited(arguments);

            this.labelSelectionStore = new Memory({
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
        postCreate: function () {
            this.own(this.layerSelect.on('change', lang.hitch(this, function (id) {
                var layer = this.layerStore.get(id);
                this.set('activeLayer', layer);
            })));

            this.colorSelect.set('value', this.color);

            this.own(this.fieldSelect.on('change', lang.hitch(this, function (id) {
                var str = ' {' + id + '}';
                this.labelTextbox.set('value', this.appendCheckbox.checked ? this.labelTextbox.value + str : str);
            })));

            this.own(this.defaultLabelSelect.on('change', lang.hitch(this, function (id) {
                if (!id) {
                    return;
                }
                this.labelTextbox.set('value', this.labelSelectionStore.get(id).value);
            })));

            //update labels when stuff changes
            var items = [this.colorSelect, this.labelTextbox, this.fontTextbox];
            items.forEach(lang.hitch(this, function (item) {
                this.own(item.on('change', lang.hitch(this, function () {
                    this.addSelectedLabels();
                })));

            }));
        },

        /**
         * empties a store
         */
        emptyStore: function (store) {
            store.query().forEach(function (item) {
                store.remove(item.id);
            });
        },

        setLabelSelections: function (layer) {
            var layerId = layer.layer.id,
                sublayer = layer.sublayer,
                count = 1;
            var hasSelections = this.labelInfos[layerId] &&
                this.labelInfos[layerId][sublayer] &&
                this.labelInfos[layerId][sublayer].selections;
            this.tabContainer.selectChild(this.tabBasic);
            if (hasSelections) {
                this.emptyStore(this.labelSelectionStore);
                this.labelInfos[layerId][sublayer].selections.forEach(lang.hitch(this, function (labelObj) {
                    labelObj.id = count++;
                    this.labelSelectionStore.put(labelObj);
                }));
                this.defaultLabelSelect.set('value', 1);
                this.labelTextbox.set('value', this.labelSelectionStore.get(1).value);
                this.addSelectedLabels();
                domClass.remove(this.defaultLabelWrapper, 'dijitHidden');
            } else {
                domClass.add(this.defaultLabelWrapper, 'dijitHidden');
            }
        }
    });

});
