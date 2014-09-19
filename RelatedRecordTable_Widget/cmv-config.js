           relatedRecords: {
                include: true,
                id: 'relatedRecords',
                position: 11,
                canFloat: true,
                open: true,
                type: 'titlePane',
                path: 'gis/dijit/RelatedRecordTable',
                title: 'Inspection Reports',
                options: {
                    map: true,
                    tocLayerInfos: true,
                    hiddenColumns: ['CULVERTID', 'OBJECTID', 'INSPECTOR'],
                    unhideableColumns: [],
                    formatters: {
                        esriFieldTypeDate: function (date) {
                            var date = new Date(date);
                            var monthNames = ["January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"];
                            return monthNames[date.getMonth()] + ' ' + date.getFullYear();
                        }
                    }
                }
            },