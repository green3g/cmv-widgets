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
            identify: {
                include: true,
                id: 'identify',
                type: 'invisible',
                path: 'gis/dijit/Identify',
                title: 'Identify',
                open: false,
                position: 3,
                options: 'config/identify'
            }

        }
    };
});
