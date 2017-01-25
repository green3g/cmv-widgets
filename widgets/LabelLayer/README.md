# Label Layer Widget

Create and modify client side label layers using existing dynamic map layers. Features
automatic indexing of all dynamic map layers in `layerInfos` and minor font
modification capabilities planned (currently supports color).

Useful in either any of the cmv types, and uses `dojo.topic` to open or show itself
when the topic is published.

![./docs/CAPTURE.png](./docs/CAPTURE.png)

## CMV config

**Title Pane**

```javascript
labelLayer: {
    title: 'Map Labels',
    id: 'labelLayer',
    include: true,
    type: 'titlePane',
    position: 15,
    path: 'roemhildtg/LabelLayer',
    options: {
        map: true,
        layerControlLayerInfos: true,
        defaultLabels: {
            assets: { // layer id
                13: [{  // sublayer id
                    name: 'Diameter - Material', //displayed to user
                    value: '{diameter}" {material}' //label string
            }]
        },
        
        // override the default colors
        colors: [{
            name: 'Black',
            id: '#000'
        }],
        
        // set the default color choice using the id
        color: '#000',
        
        //default font size
        fontSize: 8,
    }
},
```

**Floating Style**

```javascript
labelLayer: {
    title: 'Map Labels',
    id: 'labelLayer',
    include: true,
    type: 'floating',
    position: 15,
    path: 'roemhildtg/LabelLayer',
    options: {
        //options here (see above)
    }
},
```

Use layer control to publish the topic when the layer a layer's menu is selected:

```javascript
layerControl: {
    include: true,
    id: 'layerControl',
    type: 'titlePane',
    path: 'gis/dijit/LayerControl',
    title: 'Layers',
    open: true,
    position: 0,
    options: {
        subLayerMenu: {
        
            // this is the magic
            dynamic: [{
                label: 'Labels',
                topic: 'showLabelPicker',
                iconClass: 'fa fa-font fa-fw'
            }]
        },
        map: true,
        layerControlLayerInfos: true,
        separated: true,
        vectorReorder: true,
        overlayReorder: true
    }
}

```

## Outside of CMV use

```javascript
require(['roemhildtg/LabelLayer'], function(LabelLayer){
  new LabelLayer({
    layerInfos: [{
      //cmv layer info
    }],
    map: mapObject, //esri map object
  }, 'domNode');
});
```
