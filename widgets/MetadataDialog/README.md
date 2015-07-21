MetadataDialog
==============

Queries the rest endpoint of a sublayer and displays its service description. In some cases, public access to the rest endpoint of the server is not accessible to read the metadata, so this widget works around that issue. For usage in CMV (v1.3.4) with [sublayer menu option on the LayerControl](http://docs.cmv.io/en/latest/widgets/LayerControl/).

##Configuration:

```JavaScript
//layerControl widget options:
subLayerMenu: {
  dynamic: [{
      label: 'Show Metadata...',
      iconClass: 'fa fa-info fa-fw',
      topic: 'showMetadata'
  }]
}
```

```JavaScript
//widget config
metadata: {
    include: true,
    id: 'metadata',
    type: 'invisible',
    path: 'gis/widgets/MetadataDialog',
    options: {}
}
```

##Alternative configuration:

Widget developers can use this widget by publishing the following topic: `LayerControl/heatMap` and passing the correct parameters.

```JavaScript
topic.publish('LayerControl/showMetadata', {
	layer: dynamicMapServiceLayer,
	subLayer: dynamicMapServiceSubLayer
});
```