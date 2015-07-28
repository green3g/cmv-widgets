Relationship Table
====================

A tabbed widget for displaying and interacting with tables related to feature layers.
Intended for use in [CMV v1.3.3](https://github.com/cmv/cmv-app/) 

##Requirements

* Layer mode should be set to `ON_DEMAND` or `SNAPSHOT`. `SELECTION` will not work currently.
* Ensure [a proxy](https://github.com/Esri/resource-proxy) is configured and working

##Config

###CMV pane and widget config 

```JavaScript
panes: {
    left: {
        splitter: true
    }
    bottom: {
        id: 'sidebarBottom',
        placeAt: 'outer',
        splitter: true,
        collapsible: true,
        region: 'bottom',
        style: 'height:300px;display:none;',
        content: '<div id="relatedRecords" style="height:100%;"></div>'
    }
}
```

```JavaScript
relatedRecords: {
    include: true,
    id: 'relatedRecords',
    type: 'domNode',
    srcNodeRef: 'relatedRecords',
    path: 'gis/CMV_Widgets/widgets/RelationshipTableTabs',
    title: 'Related Records',
    options: {
        //required option
        layerControlLayerInfos: true,

        //optional relationships property
        relationships: {
            layerID: { //referrs to the featurelayer id
                relationshipID: { //integer, referrs to the relationship id on the rest services page
                    //relationship tab title
                    title: 'Inspections',

                    //set exclude to true to skip this relationship
                    exclude: false,
                    
                    //other dgrid options like columns may be included
                }
            }
        }
    }
}
```

###Outside of cmv usage
```JavaScript
new RelationshipTableTabs({
  layerInfos: [{
      layer: demographicsLayer
  }]
  //other options
}, 'domNodeId');
```

###Or simply use the child class directly:
```JavaScript
new RelationshipTable({
  attributes: data.attributes,
  style: 'width:100%;',
  title: 'Bridge Links',
  objectIdField: 'OBJECTID',
  relationshipId: 0,
  url: '/arcgis/rest/services/Apps/RelatedRecords/MapServer/0',
  columns: [{
    label: 'Link',
    field: 'Link_URL',
    formatter: formatters.url
  }, {
    label: 'Category',
    field: 'Category'
  }]
 }, 'domNodeId');
```

##Options Details:

Key        |      Type      | Default |  Description
---|-----|-------|----
layerInfos | boolean | `null` | set layerControlLayerInfos to true, a layerInfos object is required
relationships | {object} | `{}` | An object describing each relationship. Details below
tabPosition | string |  `'top'` | dijit tabContainer.tabPosition property: `'top'`, `'left-h'`, Not working due to layout issues: `'bottom'`, `'right-h'` 
tabContainerId | string | `null` | An optional id of a widget that is a tabContainer or contains a tabContainer property. If specified, this widgets tables will be added to an existing tabContainer like the one developed by tmcgee [here](https://github.com/tmcgee/cmv-widgets/blob/master/widgets/AttributesTable/README.md) instead of creating a new one.

####relationships property
Each relationship object may have the following properties as well as [properties 
used by dgrid](https://github.com/SitePen/dgrid/blob/master/doc/components/core-components/OnDemandList-and-OnDemandGrid.md)

Key | Type | Default | Description
----|------|---------|----
title | string | layer.name - relationship.name | the title for the relationship tab
exclude | boolean | `null` | by default all relationships are included. set exclude: false to avoid this

##Changes:

5/30/2015: Major widget changes
* moved majority of relationship querying and display code to a self-contained class RelationshipTable
* renamed class to RelationshipTableTabs to better describe the widget
* renamed widget folder to RelationshipTable
* renamed columnInfos property to relationships 

** RelationshipTable Class **
* Can be used standalone (like in identify popup) or with the RelatedRecordTabs
* Inherits all properties, methods and events from `OnDemandGrid`, `ColumnHider`, and `DijitRegistry`

##Include in identify popup:

This widget can be embedded in the identify popup. This feature requires cmv develop version with: [#419](https://github.com/cmv/cmv-app/pull/419).
In identify config, create the function that will return the domNode

```JavaScript
define([
    'dojo/dom-construct',
    'dojo/_base/lang',
    'dijit/layout/TabContainer',
    'dijit/layout/ContentPane',
    'widgets/roemhildtg/widgets/RelationshipTable/RelationshipTable'//path is relevent to wherever you placed the file
], function (domConstruct, lang, TabContainer, ContentPane, RelationshipTable) {
    var formatters = {
        relationship: function (relationship) {
           return function (data) {
               var container = new TabContainer({
                   style: 'width:100%;height:300px;'
               }, domConstruct.create('div'));
               container.startup();
               //delay then resize
               setTimeout(function () {
                   container.resize();
               }, 200);
               container.addChild(new RelationshipTable(lang.mixin({
                   attributes: data.attributes,
                   title: 'Related Records',
                   style: 'width:100%;'
               }, relationship)));
               return container.domNode;
           };
        }
    //other formatter functions
    };
```

Identify infos:
```JavaScript
91: {
    title: 'Bridge Inventory',
    content: formatters.relationship({
        title: 'Bridge Links',
        objectIdField: 'OBJECTID',
        relationshipId: 0,
        url: '/arcgis/rest/services/Apps/RelatedRecords/MapServer/0',
        columns: [{
                label: 'Link',
                field: 'Link_URL',
                formatter: formatters.url
            }, {
                label: 'Category',
                field: 'Category'
            }]
    })
}
```