//Viewer.js: 
            
relatedRecords: {
    include: true,
    id: 'relatedRecords',
    position: 0,
    canFloat: true,
    open: true,
    type: 'contentPane',
    placeAt: 'bottom',
    path: 'gis/dijit/RelatedRecordTable',
    title: 'Inspection Reports',
    options: 'config/relatedRecords'
},
                    
//relatedRecords.js:
            
define({
    layerControlLayerInfos: true,
    columnInfos: {
        bikepathDocuments: {//layer id
            1: {//relationship id
                title: 'Bikepath Documents',
                hiddenColumns: ['GlobalID', 'Related_GUID', 'OBJECTID'],
                unhideableColumns: [],
                formatters: {
                    /*
                     * format this field into a clickable link
                     */
                    Link_URL: function (url) {
                        if (url) {
                            //if url is a network file insert text for firefox/chrome
                            if (url.indexOf(":\\") !== -1 ||
                                    url.indexOf("\\\\") !== -1) {
                                return 'file:///' + url.replace(/\\/g, '/');
                            }
                            //if we have an image jpg or png
                            if (url.indexOf('jpg') !== -1 ||
                                    url.indexOf('png') !== -1) {
                                return '<a target="_blank" href="' + url + '">Link</a></td>' +
                                        '</tr><tr><td class="image" colspan="2">' +
                                        '<a target="_blank" href="' + url + '"><img src="' + url + '" alt="" /></a>';
                            } else if (url.indexOf("http") !== -1 ||
                                    url.indexOf(":/") !== -1 ||
                                    url.indexOf("//") !== -1) {
                                return '<a target="_blank" href="' + url + '">Link</a>';
                            }
                        }
                        return '';
                    }
                }
            }
        },
        culvertInspections: {
            0: { 
                title: "Culvert Inspections",
                hiddenColumns: ['CULVERTID', 'OBJECTID', 'INSPECTOR'],
                unhideableColumns: []
            }
        }
    },
    //global formatters
    formatters: {
        /*
         * format all esri date fields into Month Year
         */
        esriFieldTypeDate: function (date) {
            if (date) {
                var date = new Date(date);
                var monthNames = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];
                return monthNames[date.getMonth()] + ' ' + date.getFullYear();
            }
            return '';
        },
    }
});