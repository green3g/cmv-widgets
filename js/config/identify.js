define([
    'widgets/RelationshipTable/idenitfy/factory'
], function (factory) {

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
                    content: factory([{
                        objectIdField: 'OBJECTID',
                        url: 'http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Petroleum/KSPetro/MapServer/1',
                        relationshipId: 1,
                        columns: [{
                            field: 'FIELD_KID',
                            label: 'Field KID'
                        }, {
                            field: 'WELL_NAME',
                            label: 'Name'
                        }]
                    }])
                }
            }
        }
    };
});
