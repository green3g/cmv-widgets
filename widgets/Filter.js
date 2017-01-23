define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_Templated',
    'dojo/store/Memory',
    'dojo/_base/lang',
    'esri/request',
    'dojo/topic',
    'dojo/dom-style',
    'esri/tasks/query',
    'esri/tasks/QueryTask',

    'dojo/text!./Filter/templates/filter.html',
    'dojo/i18n!./Filter/nls/filter',
    'xstyle/css!./Filter/css/filter.css',

    'dijit/form/FilteringSelect',
    'dijit/form/ValidationTextBox',
    'dijit/form/Button',
    'dijit/Toolbar'
],
    function (declare, _WidgetBase, _Templated, Memory, lang, request, topic, domStyle, Query, QueryTask, templateString, i18n) {

        var string_convertor = function (val, op) {
            if (op.id === 'contains') {
                val = '%' + val + '%';
            }
            return '\'' + val + '\'';
        };

        var CONVERTORS = {
            esriFieldTypeInteger: parseInt,
            esriFieldTypeOID: parseInt,
            esriFieldTypeSmallInteger: parseInt,
            esriFieldTypeDate: Date,
            esriFieldTypeDouble: parseFloat,
            esriFieldTypeSingle: parseFloat,
            esriFieldTypeString: string_convertor,
            default: string_convertor
        };

        var EXCLUDE_TYPES = [
            'esriFieldTypeBlob',
            'esriFieldTypeGeometry',
            'esriFieldTypeRaster',
            'esriFieldTypeGUID',
            'esriFieldTypeGlobalID'
        ];

        var OPERATORS = [{
            name: 'Equals',
            id: 'equal',
            operator: '='
        }, {
            name: 'Contains',
            id: 'contains',
            operator: 'LIKE'
        }, {
            name: 'Greater Than',
            id: 'gt',
            operator: '>'
        }, {
            name: 'Less Than',
            id: 'lt',
            operator: '<'
        }];

        return declare([_WidgetBase, _Templated], {
            templateString: templateString,
            widgetsInTemplate: true,
            i18n: i18n,
            layerStore: null,
            fieldStore: null,
            opStore: null,
            operators: OPERATORS,
            defaultOperator: 'equal',
            convertors: CONVERTORS,
            /**
             * The layer infos objects array, use the set method to update
             * @property {Array}
             */
            layerInfos: [],
            _setLayerInfosAttr: function (layerInfos) {
                var store = this.layerStore;
                layerInfos.forEach(function (l) {
                    if (l.layer.layerInfos) {
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
                    }
                });
            },
            /**
             * the selected field
             * @property {Object}
             */
            selectedField: null,
            _setSelectedFieldAttr: function (field) {
                this.selectedField = field;

                //reset values list
                this.set('values', []);
            },
            /**
             * The currently selected layer objects properties.
             * @property {Object}
             */
            selectedLayer: null,
            _setSelectedLayerAttr: function (l) {
                var def = request({
                    url: l.layer.url + '/' + l.sublayer,
                    content: {
                        'f': 'json'
                    }
                });
                def.then(lang.hitch(this, function (data) {
                    this.selectedLayer.name = data.name;
                    this.set('layerMetadata', data);
                }));
                this.selectedLayer = l;
            },
            selectedValue: '',
            _setSelectedValueAttr: function (value) {
                this.selectedValue = value;
            },
            /**
             * The selected layers metadata object. Use the set() method to update
             * @property {Object}
             */
            layerMetadata: {},
            _setLayerMetadataAttr: function (layerProps) {
                this.layerMetadata = layerProps;

                this.fieldSelect.set('value', '');

                //update the field store
                var store = this.fieldStore;
                var convertors = this.convertors;
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
                        name: f.alias,
                        convert: convertors[f.type || 'default']
                    });
                });
            },
            /**
             * Whether or not to display the value select dropdown
             * This is automatically updated when values is set
             * @property {Boolean}
             */
            valueSelectVisible: false,
            _setValueSelectVisibleAttr: function (visible) {
                this.valueSelectVisible = visible;

                //hide the text box and button
                domStyle.set(this.valueListButton.domNode, 'display', visible ? 'none' : '');
                domStyle.set(this.valueText.domNode, 'display', visible ? 'none' : '');

                //show the value select dropdown
                domStyle.set(this.valueSelect.domNode, 'display', visible ? 'block' : 'none');
            },
            /**
             * The list of values available to filter on.
             * Use set method to fill this value:
             *     `this.set('values', [1, 3, 4]);`
             * @property {Array}
             */
            values: [],
            _setValuesAttr: function (values) {
                this.values = values;

                //update visibility of value entry form
                this.set('valueSelectVisible', Boolean(values.length));

                // update the store
                var store = this.valueStore;
                this.emptyStore(store);
                values.forEach(function (val) {
                    store.put({
                        name: val || i18n.values.noValue,
                        id: val
                    });
                });
            },
            /**
             * the default constructor, performs initialization of stores
             * @return {[type]} [description]
             */
            constructor: function () {
                this.inherited(arguments);
                this.layerStore = new Memory({
                    data: []
                });
                this.fieldStore = new Memory({
                    data: []
                });
                this.opStore = new Memory({
                    data: this.operators
                });
                this.valueStore = new Memory({
                    data: []
                });

            },
            postCreate: function () {
                this.inherited(arguments);
                this.opSelect.set('value', this.defaultOperator);

                // event handles
                // layer select dropdown
                this.own(this.layerSelect.on('change', lang.hitch(this, function (id) {
                    this.set('selectedLayer', this.layerStore.get(id));
                })));

                //field select dropdown
                this.own(this.fieldSelect.on('change', lang.hitch(this, function (id) {
                    this.set('selectedField', this.fieldStore.get(id));
                })));

                //operator select dropdwn
                this.own(this.opSelect.on('change', lang.hitch(this, function (id) {
                    this.set('selectedOperator', this.opStore.get(id));
                })));

                //value select dropdown and textbox
                this.own(this.valueText.on('change', lang.hitch(this, function (val) {
                    this.set('selectedValue', val);
                })));
                this.own(this.valueSelect.on('change', lang.hitch(this, function (val) {
                    this.set('selectedValue', val);
                })));

            },
            /**
             * empties a store
             */
            emptyStore: function (store) {
                store.query().forEach(function (item) {
                    store.remove(item.id);
                });
            },
            /**
             * selects distinct values for the current layer and field
             */
            fetchDistinctValues: function () {
                if (!this.selectedField) {
                    return;
                }
                var query = lang.mixin(new Query(), {
                    returnGeometry: false,
                    returnDistinctValues: true,
                    outFields: [this.selectedField.id],
                    where: '1=1'
                });

                var _this = this;
                new QueryTask(this.selectedLayer.layer.url + '/' + this.selectedLayer.sublayer)
                    .execute(query)
                    .then(function (data) {
                        _this.set('values', data.features.map(function (f) {
                            return f.attributes[_this.selectedField.id];
                        }));
                    }).otherwise(function (e) {});
            },
            /**
             * builds and returns a where clause based on values in the widget
             * @return {String}  The where clause
             */
            buildWhereClause: function () {
                var value = this.selectedField.convert(this.selectedValue, this.selectedOperator);

                return lang.replace('{field} {operator} {value}', {
                    field: this.selectedField.id,
                    operator: this.selectedOperator.operator,
                    value: value
                });
            },
            /**
             * publishes a topic to open an attributes table
             */
            openTable: function () {
                topic.publish('attributesContainer/addTable', {
                    // title for tab
                    title: this.selectedLayer.name,

                    // unique topicID so it doesn't collide with
                    // other instances of attributes table
                    topicID: this.selectedLayer.layer.id + this.selectedLayer.sublayer,

                    // allow tabs to be closed
                    // confirm tab closure
                    closable: true,
                    confirmClose: true,

                    queryOptions: {
                        // parameters for the query
                        queryParameters: {
                            url: this.selectedLayer.layer.url + '/' + this.selectedLayer.sublayer,
                            maxAllowableOffset: 100,
                            where: this.buildWhereClause()
                        }
                    }
                });
            },
            setLayerDefinitions: function () {
                var def = this.selectedLayer.layerDefinitions || [];
                def[this.selectedLayer.sublayer] = this.buildWhereClause();
                this.selectedLayer.layer.setLayerDefinitions(def);
            }
        });
    });
