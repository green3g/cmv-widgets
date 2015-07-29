TimeSlider
==============

Places a simple esri timeslider widget in a node. Controls the view of all time enabled layers in the map.

##Configuration:

```JavaScript
//enable the bottom pane and give it a node
bottom: {
    id: 'sidebarBottom',
    placeAt: 'outer',
    splitter: true,
    collapsible: true,
    region: 'bottom',
    style: 'height:300px;display:block;',
    content: '<div id="timeSlider" style="height:100%;"></div>'
},
```

```JavaScript
//widget config
timeSlider: {
    include: true,
    id: 'timeSlider',
    type: 'domNode',
    srcNodeRef: 'timeSlider',
    path: 'gis/roemhildtg/widgets/TimeSlider',
    title: 'Time Slider',
    options: {
        map: true
    }
}
```
