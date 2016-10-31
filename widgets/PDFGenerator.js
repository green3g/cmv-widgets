define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_Templated',
    'dojo/topic',
    'dojo/_base/lang',
    'dojo/store/Memory',
    'dojo/text!./LabelLayer/templates/LabelLayer.html',
    'dojo/i18n!./LabelLayer/nls/LabelLayer',
    'dijit/form/Button',
    'pdfmake/pdfmake'

], function (declare, _WidgetBase, _Templated, topic, lang, Memory, templateString, i18n, Button, pdfmake) {

    // make sure pdfmake is loaded then import the font vs
    require(['pdfmake/vfs_fonts']);

    return declare([_WidgetBase], {
        templateString: templateString,
        widgetsInTemplate: true,
        i18n: i18n,
        topic: 'attributesContainer/tableAdded',
        pdfDefinitions: {

            // tab title
            'Parcels': {

                // the template to place in the pdf for each row
                rowTemplate: '{DEEDHOLD}\n' +
                      '{MAILADDR}\n' +
                      '{MAILCITY}, {MAILSTATE} {MAILZIP}\n\n',

                // the button to add to the attributes table toolbar
                button: {
                    label: '<i class="fa fa-envelope"></i> Mailing Labels'
                },

                //the number of columns in the pdf document
                columns: 3

                // the default pdf options to override, i.e. fontSize
                // pdfDefaults: {defaultStyle: { fontSize: 8 }}
            }
        },
        tabsWithButtons: {},
        postCreate: function () {
            this.inherited(arguments);
            //subscribe a topic to modify the attributes container add tab
            topic.subscribe(this.topic, lang.hitch(this, function (tab) {
                if (this.tabsWithButtons[tab.title] || !this.pdfDefinitions.hasOwnProperty(tab.title)) {
                    return;
                }

                this.addButton(tab, this.pdfDefinitions[tab.title].button);
                this.tabsWithButtons[tab.title] = true;
            }));
            // topic.subscribe(this.topic, lang.hitch(this, 'handleTopic'));
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
        /**
         * empties a store
         */
        emptyStore: function (store) {
            store.query().forEach(function (item) {
                store.remove(item.id);
            });
        },
        addButton: function (tab, options) {
            tab.attributesTableToolbarDijit.addChild(new Button(lang.mixin(options, {
                tab: tab,
                generator: this,
                onClick: function () {
                    this.generator.generateRows(this.tab.grid.store.data, this.generator.pdfDefinitions[this.tab.title]);
                }
            })));
        },
        generateRows: function (data, def) {
            var dd = lang.mixin({
                content: {
                    columns: []
                },
                styles: {
                    header: {
                        fontSize: 18,
                        bold: true
                    },
                    bigger: {
                        fontSize: 15,
                        italics: true
                    }
                },
                defaultStyle: {
                    columnGap: 20,
                    fontSize: 10
                }
            }, def.pdfDefaults || {});


            for (var i = 0; i < def.columns; i ++) {
                dd.content.columns.push({
                    text: []
                });
            }

            for (i = 0; i < data.length; i ++) {
                for (var j = 0; j < def.columns && i < data.length; j ++) {
                    dd.content.columns[j].text.push(lang.replace(def.rowTemplate, data[i]));
                    i ++;
                }
            }

            window.pdfMake.createPdf(dd).open();
        }
    });
});
