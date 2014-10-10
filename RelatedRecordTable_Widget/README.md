Related Record Table
====================

A tabbed widget for displaying and interacting with tables related to feature layers.
Intended for use in [CMV v1.3.0](https://github.com/cmv/cmv-app/releases/tag/v1.2.0) 

![Screenshot!](https://github.com/roemhildtg/CMV_Widgets/blob/master/RelatedRecordTable_Widget/Widget.PNG)

Usage
======

1. Add feature layers that have a relationship. Note: the layers must be type: 'feature', this widget will not display related records in dynamic layers. Also, mode should be set to ON_DEMAND or SNAPSHOT. SELECTION will not work currently.
2. Ensure a proxy is configured and working
2. Set the widget config to include a layerInfos
3. Set the widget to be 'open' or visible by default ( this is important for the tab container to render correctly )
3. Click on a feature layer to see related records.
4. Bonus: Set up columnInfos to format relationship table.

Options:
========

Key        |      Type      | Default |  Description
---|-----|-------|----
layerInfos | boolean | `null` | set tocLayerInfos or layerControlLayerInfos to true, a layerInfos object is required
formatters | {object} | `{}` |  key, value pairs of column formatter functions. Key is either a field name or esri field type.
columnInfos | {object} | `{}` | An object describing each relationship
tabPosition | string |  `'left-h'` | dijit tabContainer.tabPosition property: `'top'`, `'left-h'`, Not working due to layout issues: `'bottom'`, `'right-h'` 

###formatters properties
Usage: 
```JavaScript
formatters: {
 key: function(value) { return newValue },
 ...
}
```
Key can either be an esriFieldType Example: `esriFieldTypeDate` or a name of a field. Formatters specified in this formatters object will be applied to all columns that meet the field type or name specified.

###columnInfos Properties
Usage:
```JavaScript
columnInfos: {
 layerID: { //referrs to the featurelayer id
  relationshipID { //integer, referrs to the relationship id on the rest services page
   //columnInfos definition (below)
  }
 }
}
```
Key | Type | Default | Description
---|---|---|---
title | string | Layer.name - Relationship.name |The title of the tab
include | boolean | `true` | set to false to exclude this relationship from the widget
hiddenColumns | [field_names] | `[]` | Array of field names to hide from this relationship table
unhideableColumns | [field_names] | `[]` | Array of field names that can't be hidden by the user
formatters | {object} | `{}` | a key-value object consisting of column formatter functions specific to this relationship table

Additional Notes:
============

- Widget must be set to a visible state by default, example `open: true` should be set for a titlePane type widget.
