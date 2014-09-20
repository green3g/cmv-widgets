Related Record Table
====================

A tabbed widget for displaying and interacting with tables related to feature layers.
Intended for use in [CMV v1.2.0](https://github.com/cmv/cmv-app/releases/tag/v1.2.0) 

![Screenshot!](https://github.com/roemhildtg/CMV_Widgets/blob/master/RelatedRecordTable_Widget/Widget.PNG)

Options:
========

key        |      Type      | Notes
---|-----|-------
map | boolean | set true, map is required
layerInfos | boolean | set tocLayerInfos or layerControlLayerInfos to true, a layerInfos object is required
hiddenColumns | [field_names] | optional array of field names to hide by default
unhideableColumns | [field_names] | optional array of field names to always show
formatters | {object} | key, value pairs of formatter functions. Key is either a field name or esri field type.

Usage
======

1. Add feature layers that have a relationship
2. Set the widget config to include map and a layerInfos
3. Set the widget to be 'open' or visible by default ( this is important for the tab container to render correctly )
3. click on a feature layer to see related records.


CMV Widget Config Example
=========================

```javascript
 relatedRecords: {
    include: true,
    id: 'relatedRecords',
    position: 0,
    open: true,
    type: 'contentPane',
    placeAt: 'bottom',
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
                var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
                return monthNames[date.getMonth()] + ' ' + date.getFullYear();
            }
        }
    }
}
```
Limitations:
============

Currently only handles one relationship per layer
