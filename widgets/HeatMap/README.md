HeatMap
=======

Dynamically renders heatmaps on point layers. For usage in CMV (v1.3.4) with [sublayer menu option on the LayerControl](http://docs.cmv.io/en/latest/widgets/LayerControl/). Credit to [@ERS-Long](https://github.com/ERS-Long/HeatMap)

##Requirements:

* Layer must be type point
* Layer must have a field of type `esriFieldTypeGeometry`

##Configuration:

```JavaScript
//layerControl widget options:
subLayerMenu: {
  dynamic: [{
      label: 'Toggle Heatmap...',
      iconClass: 'fa fa-fire fa-fw',
      topic: 'heatMap'
  }]
}
```

```JavaScript
//widget config
heatmap: {
    include: true,
    id: 'heatmap',
    type: 'invisible',
    path: 'gis/widgets/HeatMap',
    options: {
        map: true
    }
}
```

##Alternative configuration:

Widget developers can use this widget by publishing the following topic: `LayerControl/heatMap` and passing the correct parameters.

```JavaScript
topic.publish('LayerControl/heatMap', {
	layer: dynamicMapServiceLayer,
	subLayer: dynamicMapServiceSubLayer,
	iconNode: optionalIconDomNode
});
```