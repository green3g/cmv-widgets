define(['./viewer'], function (baseConfig) {

    baseConfig.panes = {
        bottom: {
            id: 'sidebarBottom',
            placeAt: 'outer',
            splitter: true,
            collapsible: true,
            region: 'bottom',
            style: 'height:200px;',
            content: '<div id="attributesContainer"></div>'
        }
    };


    baseConfig.widgets = {
        attributesTable: {
            include: true,
            id: 'attributesContainer',
            type: 'domNode',
            srcNodeRef: 'attributesContainer',
            path: 'tmcgee/AttributesTable',
            options: {
                map: true,
                mapClickMode: true,

              // use a tab container for multiple tables or
              // show only a single table
                useTabs: false,

              // used to open the sidebar after a query has completed
                sidebarID: 'sidebarBottom',

                tables: [
                ]
            }
        },
        filter: {
            include: true,
            id: 'filter',
            position: 2,
            open: true,
            type: 'titlePane',
            path: 'widgets/Filter',
            title: 'Filter/Query Map',
            options: {
                layerControlLayerInfos: true
            //show map button
            // showMapButton: true,
            // show table button
            // showTableButton: true
            }
        }
    };
    return baseConfig;
});
