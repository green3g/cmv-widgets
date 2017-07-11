define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dijit/form/FilteringSelect',
    'dojo/store/Memory',
    'dojo/topic'
], function (declare, array, lang, FilteringSelect, Memory, topic) {
    return declare([FilteringSelect], {
        /**
         * Array of theme objects like:
         * {
         *     name: 'Theme Name',
         *     id: 'myTheme',
         *     layers: {
         *      layerId: {
         *        visible: true,
         *        visibleLayers: [8,9]
         *      }
         *     }
         * }
         */
        themes: [],
        _setThemesAttr: function (themes) {
            themes = [{name: '-  Select Theme  -', selected: true, id: 'none'}].concat(themes);
            this.themes = themes;
            this.store.setData(themes);
            this.set('value', 'none');
        },
        /**
         * Layer infos:
         * {
         *     layer: <layer object>
         * }
         */
        layerInfos: [],
        name: 'themeSelect',
        id: 'themeSelect',
        style: 'width:100%;',
        value: 'none',
        _setValueAttr: function (val) {
            this.inherited(arguments);
            var themeObj = this.store.get(val);
            if (!themeObj || val === 'none') {
                return;
            }
            array.forEach(this.layerInfos, function (info) {
                if (themeObj.layers.hasOwnProperty(info.layer.id)) {
                    if (info.layer.hasOwnProperty('visible') &&
                          themeObj.layers[info.layer.id].hasOwnProperty('visible')) {
                        info.layer.setVisibility(themeObj.layers[info.layer.id].visible);
                        topic.publish('layerControl/layerToggle', {
                            id: info.layer.id,
                            visible: themeObj.layers[info.layer.id].visible
                        });
                    }
                    if (info.layer.hasOwnProperty('visibleLayers') &&
                          themeObj.layers[info.layer.id].hasOwnProperty('visibleLayers')) {
                        info.layer.setVisibleLayers(themeObj.layers[info.layer.id].visibleLayers);
                        topic.publish('layerControl/setVisibleLayers', {
                            id: info.layer.id,
                            visibleLayers: themeObj.layers[info.layer.id].visibleLayers
                        });
                    }
                } else {
                    info.layer.setVisibility(false);
                }
            });
        },
        store: null,
        constructor: function () {
            this.inherited(arguments);
            this.set({
                store: new Memory({
                    data: this.themes
                })
            });
        },
        postCreate: function () {
            this.inherited(arguments);
            if (!this.layerInfos) {
                this.destroyRecursive();
                topic.publish('viewer/handleError', {
                    source: 'Themes',
                    error: 'layerInfos is required'
                });
            }
        }
    });
});
