define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_Templated',
    'dojo/topic',
    'dojo/_base/lang',
    'dijit/form/Button',
    'pdfmake/pdfmake',
    'dojo/i18n!./PDFGenerator/nls/PDFGenerator'

], function (declare, _WidgetBase, _Templated, topic, lang, Button, pdfmake, i18n) {

    // make sure pdfmake is loaded then import the font vs
    require(['pdfmake/vfs_fonts']);

    var defIndex = 0;

    return declare([_WidgetBase], {
        i18n: i18n,
        attributesTableTopic: 'attributesContainer/tableAdded',
        topic: 'pdf/generate',
        pdfDefinitions: [{
            id: 'parcel',
          // optional attributes tab title
            title: 'Parcels',
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
        }],
        _setPdfDefinitionsAttr: function (defs) {
            defs.forEach(function (d) {
                if (!d.id) {
                    d.id = 'pdf-' + defIndex ++;
                }
            });
            this.pdfDefinitions = defs;
        },
        tabsWithButtons: {},
        postCreate: function () {
            this.inherited(arguments);
            var _this = this;
            //subscribe a topic to modify the attributes container add tab
            topic.subscribe(this.attributesTableTopic, function (tab) {
                if (_this.tabsWithButtons[tab.title]) {
                    return;
                }
                _this.pdfDefinitions.forEach(function (def) {
                    if (def.tab === tab.title) {
                        _this.addButton(tab, def);
                    }
                });
                _this.tabsWithButtons[tab.title] = true;
            });

            // subscribe to our own topic
            topic.subscribe(this.topic, lang.hitch(this, 'generatePDF'));
        },
        addButton: function (tab, options) {
            tab.attributesTableToolbarDijit.addChild(new Button(lang.mixin(options.button, {
                tab: tab,
                generator: this,
                onClick: function () {
                    this.generator.generatePDF(tab.grid.store.data, options.id);
                }
            })));
        },
        getDefinition: function (id) {
            var result = this.pdfDefinitions.filter(function (def) {
                return def.id === id;
            });

            if (result.length) {
                return result[0];
            }
            return null;
        },
        generatePDF: function (data, id) {
            var def = this.getDefinition(id);
            if (!def) {
                throw Error('The specified definition could not be found: ' + id);
            }
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
