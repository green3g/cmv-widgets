define([
  'dijit/layout/TabContainer',
  'dijit/layout/ContentPane',
  'widgets/RelationshipTable/RelationshipTable',
  'dojo/dom-construct',
  'dojo/_base/lang'
], function(TabContainer, ContentPane, RelationshipTable, domConstruct, lang) {

  var formatters = {
    attributeList: function(identifyResults) {
      var listItem = '<tr><td class="attrName">{0}</td><td class="attrValue">{1}</td></tr>';
      var html = ['<table class="attrTable">'];
      for (var a in identifyResults.attributes) {
        //make sure a is an own property
        if (identifyResults.attributes.hasOwnProperty(a)) {
          html.push(lang.replace(listItem, [a, identifyResults.attributes[a]]));
        }
      }
      html.push('</table>');
      return html.join('');
    },
    /**
     * factory function to return a formatter
     * @param {object} relationship the properties for the relationship table
     */
    relationship: function(relationship) {
        //create a new function and return it
        return function(data) {
          var container = new TabContainer({
            style: 'width:100%;height:300px;'
          }, domConstruct.create('div'));
          container.startup();
          //delay then resize
          setTimeout(function() {
            container.resize();
          }, 200);
          container.addChild(new ContentPane({
            title: 'Attributes',
            content: formatters.attributeList(data)
          }));
          container.addChild(new RelationshipTable(lang.mixin({
            //pass attributes to the constructor so it queries automatically
            attributes: data.attributes,
            //pass a title for the tab container
            title: 'Related Records',
            //make sure it fills it completely
            style: 'width:100%;'
          }, relationship)));
          return container.domNode;
        };
      }
      //other formatter functions
  };
  return {
    map: true,
    mapClickMode: true,
    mapRightClickMenu: true,
    identifyLayerInfos: true,
    identifyTolerance: 5,

    // config object definition:
    //	{<layer id>:{
    //		<sub layer number>:{
    //			<pop-up definition, see link below>
    //			}
    //		},
    //	<layer id>:{
    //		<sub layer number>:{
    //			<pop-up definition, see link below>
    //			}
    //		}
    //	}

    // for details on pop-up definition see: https://developers.arcgis.com/javascript/jshelp/intro_popuptemplate.html

    identifies: {
      wellFields: {
        1: {
          title: 'Petrolium',
          //for our content formatter, we call the function, since
          //it returns a function
          content: formatters.relationship({
            objectIdField: 'Object ID',
            url: 'http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Petroleum/KSPetro/MapServer/1',
            relationshipId: 2,
            columns: [{
              field: 'FIELD_KID',
              label: 'Field KID'
            }, {
              field: 'WELL_NAME',
              label: 'Name'
            }]
          })
        }
      }
    }
  };
});
