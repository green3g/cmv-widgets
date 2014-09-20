Related Record Table
====================

A tabbed widget for displaying and interacting with tables related to feature layers.
Intended for use in [CMV v1.2.0](https://github.com/cmv/cmv-app/releases/tag/v1.2.0) 

Options:
========

key        |      Value      | Notes
---|-----|-------
map | true | required
layerInfos | true | required (layerInfos object with feature layers)
hiddenColumns | [field_names] | array of field names to hide by default
unhideableColumns | [field_names] | array of field names to always show
formatters | {object} | key, value pairs of formatter functions for field name or field type

Limitations:
============

Currently only handles one relationship per layer

CMV Widget Config Example
=========================

```javascript
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
}
```