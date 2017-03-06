/**
 * Defines a content formatter for showing relationships in a popup
 *
 * Usage:
 *
 * ```javascript
 *
  define([roemhildtg/RelationshipTable/identify/factory], function(factory){

      identifies: {
        layerId: {
            0: {
                content: factory([{
                title: 'Bridge Links',
                objectIdField: 'OBJECTID',
                relationshipId: 0,
                url: '/arcgis/rest/services/Apps/RelatedRecords/MapServer/0',
                columns: [{
                        label: 'Link',
                        field: 'Link_URL',
                        formatter: formatters.url
                    }, {
                        label: 'Category',
                        field: 'Category'
                    }]
             }])
           }
      }
    }

  });
 *
 * ```
 */

define([
    'dojo/dom-construct',
    'dojo/_base/lang',
    'dijit/layout/TabContainer',
    'dijit/layout/ContentPane',
    '../RelationshipTable'
], function (domConstruct, lang, TabContainer, ContentPane, RelationshipTable) {

    function attributes (identifyResults) {
            //set up our templates for lang.replace
        var row = '<tr><td class="attrName">{field}</td><td class="attrValue">{value}</td></tr>';
        var table = '<table class="attrTable"><tbody>{rows}</tbody></table>';
        var rows = [];
        for (var a in identifyResults.attributes) {
            if (identifyResults.attributes.hasOwnProperty(a)) {
                rows.push(lang.replace(row, {
                    field: a,
                    value: identifyResults.attributes[a]
                }));
            }
        }
        var html = lang.replace(table, {
            rows: rows.join('')
        });
        return html;
    }

    function factory (relationships) {
        return function (data) {

            var container = new TabContainer({
                style: 'width:100%;height:280px;'
            }, domConstruct.create('div'));

            // add a basic attributes table
            container.addChild(new ContentPane({
                title: 'Properties',
                content: attributes(data)
            }));

            // create new relationship tables for each relationship passed
            relationships.forEach(function (rel) {
                container.addChild(new RelationshipTable(lang.mixin({
                    attributes: data.attributes,
                    title: 'Related Records',
                    style: 'width:100%;'
                }, rel)));
            });
            setTimeout(function () {
                container.resize();
            }, 200);
            return container.domNode;
        };
    }

    return factory;
});
