define([
    'esri/units',
    'esri/geometry/Extent',
    'esri/config',
    'esri/tasks/GeometryService',
    'esri/layers/ImageParameters'
], function (units, Extent, esriConfig, GeometryService, ImageParameters) {

    // the root
    var baseURL = '/gis/static_apps/cmv-widgets-demo/';

    // url to your proxy page, must be on same machine hosting you app. See proxy folder for readme.
    esriConfig.defaults.io.proxyUrl = baseURL + 'DotNet/proxy.ashx';
    esriConfig.defaults.io.alwaysUseProxy = false;
    // url to your geometry server.
    esriConfig.defaults.geometryService = new GeometryService('https://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer');
    // esriConfig.defaults.io.corsEnabledServers.push('sampleserver3.arcgisonline.com');

    //image parameters for dynamic services, set to png32 for higher quality exports.
    var imageParameters = new ImageParameters();
    imageParameters.format = 'png32';

    return {
        // used for debugging your app
        isDebug: true,

        //default mapClick mode, mapClickMode lets widgets know what mode the map is in to avoid multipult map click actions from taking place (ie identify while drawing).
        defaultMapClickMode: 'identify',
        // map options, passed to map constructor. see: https://developers.arcgis.com/javascript/jsapi/map-amd.html#map1
        mapOptions: {
            basemap: 'streets',
            center: [-96.59179687497497, 39.09596293629694],
            zoom: 5,
            sliderStyle: 'small'
        },
        panes: {
            left: {
                splitter: false,
                collapsible: true
            },
            bottom: {
                id: 'sidebarBottom',
                placeAt: 'outer',
                splitter: true,
                collapsible: true,
                region: 'bottom',
                content: '<div id="relatedRecords" style="height:100%;"></div>'
            },
            top: {
                style: 'height:60px;display:block;',
                content: '<div id="timeSlider" style="height:100%;"></div>',
                id: 'sidebarTop',
                placeAt: 'outer',
                collapsible: true,
                splitter: true,
                region: 'top'
            }
        },
        collapseButtonsPane: 'center', //center or outer

        // operationalLayers: Array of Layers to load on top of the basemap: valid 'type' options: 'dynamic', 'tiled', 'feature'.
        // The 'options' object is passed as the layers options for constructor. Title will be used in the legend only. id's must be unique and have no spaces.
        // 3 'mode' options: MODE_SNAPSHOT = 0, MODE_ONDEMAND = 1, MODE_SELECTION = 2
        operationalLayers: [{
            type: 'feature',
            url: 'https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Petroleum/KSPetro/MapServer/1',
            title: 'Well fields',
            options: {
                id: 'wellFields',
                visible: true,
                outFields: ['*'],
                opacity: 0.5,
                mode: 0
            },
            editorLayerInfos: {
                disableGeometryUpdate: false
            },
            legendLayerInfos: {
                exclude: false,
                layerInfo: {
                    title: 'My layer'
                }
            }
        }, {
            type: 'feature',
            url: 'https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Petroleum/KSPetro/MapServer/0',
            title: 'Petrolium',
            options: {
                id: 'Petrolium',
                opacity: 1.0,
                visible: true,
                mode: 0
            }
        }, {
            type: 'dynamic',
            url: 'https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Petroleum/KSWells/MapServer',
            title: 'Time Enabled Kansas Wells',
            options: {
                id: 'timeKansas',
                opacity: 1.0,
                visible: true,
                imageParameters: imageParameters
            },
            identifyLayerInfos: {
                layerIds: [2, 4, 5, 8, 12, 21]
            },
            legendLayerInfos: {
                layerInfo: {
                    hideLayers: [21]
                }
            }
        }, {
            type: 'dynamic',
            url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/DamageAssessment/MapServer',
            title: 'Damage Assessment',
            options: {
                id: 'DamageAssessment',
                opacity: 1.0,
                visible: true,
                imageParameters: imageParameters
            },
            legendLayerInfos: {
                exclude: true
            },
            layerControlLayerInfos: {
                swipe: true,
                metadataUrl: true,
                expanded: true
            }
        }],
        // set include:true to load. For titlePane type set position the the desired order in the sidebar
        widgets: {
            growler: {
                include: true,
                id: 'growler',
                type: 'domNode',
                path: 'gis/dijit/Growler',
                srcNodeRef: 'growlerDijit',
                options: {}
            },
            identify: {
                include: true,
                id: 'identify',
                type: 'invisible',
                path: 'gis/dijit/Identify',
                title: 'Identify',
                open: false,
                position: 3,
                options: 'config/identify'
            },
            layerControl: {
                include: true,
                id: 'layerControl',
                type: 'titlePane',
                path: 'gis/dijit/LayerControl',
                title: 'Layers',
                open: true,
                position: 0,
                options: {
                    map: true,
                    layerControlLayerInfos: true,
                    separated: true,
                    vectorReorder: true,
                    overlayReorder: true,
                    subLayerMenu: {
                        dynamic: [{
                            label: 'Toggle Heatmap...',
                            iconClass: 'fa fa-fire fa-fw',
                            topic: 'heatMap'
                        }, {
                            label: 'Show Metadata...',
                            iconClass: 'fa fa-info fa-fw',
                            topic: 'showMetadata'
                        }]
                    }
                }
            },
            relatedRecords: {
                include: true,
                id: 'relatedRecords',
                type: 'domNode',
                srcNodeRef: 'relatedRecords',
                path: 'widgets/RelationshipTableTabs',
                title: 'Related Records',
                options: {
                    //required option
                    layerControlLayerInfos: true,

                    //optional relationships property
                    relationships: {
                        Petrolium: { //layerID (integer) key refers to featurelayer id on the rest services page
                            3: { //relationshipID (integer) key referrs to the relationship id on the rest services page
                                //relationship tab title
                                title: 'Well Tops',

                                //set exclude to true to skip this relationship
                                exclude: false,

                                //other dgrid options like columns may be included
                                columns: [{
                                    field: 'FIELD_KID',
                                    label: 'Field KID'
                                }, {
                                    field: 'WELL_NAME',
                                    label: 'Name'
                                }]
                            }
                        }
                    }
                }
            },
            settings: {
                include: true,
                id: 'settings',
                position: 1,
                open: true,
                type: 'titlePane',
                path: 'widgets/AppSettings',
                title: 'Save/Share Current Map',
                options: {

                    //these options are required:
                    map: true,
                    layerControlLayerInfos: true,

                    //NOT required unless you want to add additional settings to save
                    appSettings: {
                        yourSetting: {
                            label: 'Your Other Setting to save',
                            checkbox: true,
                            save: true
                        }
                    }

                    //these options are NOT required (defaults are shown):
                    // parametername: 'cmvSettings',
                    // mapRightClickMenu: true,
                    // address: 'email@email.com',
                    // subject: 'Share Map',
                    // body: 'Check out this map! <br /> ',
                    // emailSettings: ['mapExtent', 'layerVisibility'],
                    // shareNode: null,
                    // shareTemplate: '<a href="#"><i class="fa fa-fw fa-envelope-o"></i>Share Map</a>',
                    // server: baseURL + 'widgets/AppSettings/php/'
                }
            },
            //widget config
            timeSlider: {
                include: true,
                id: 'timeSlider',
                type: 'domNode',
                srcNodeRef: 'timeSlider',
                path: 'widgets/TimeSlider',
                title: 'Time Slider',
                options: {
                    map: true
                }
            },
            heatmap: {
                include: true,
                id: 'heatmap',
                type: 'invisible',
                path: 'widgets/HeatMap',
                options: {
                    map: true
                }
            },
            metadata: {
                include: true,
                id: 'metadata',
                type: 'invisible',
                path: 'widgets/MetadataDialog',
                options: {}
            }

        }
    };
});
