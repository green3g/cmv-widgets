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

###Options
Key | Type | Default | Description
---|---|---|---
`map` | `esri.map` | `null` | Required. In CMV set `map: true` so the app passes the map in
`startTime` | `Date` | `new Date('1/1/1921')` | Optional. The start date for the timeslider
`endTime` | `Date` | `new Date('12/31/2016')` | Optional. The end date for the timeslider
`timeInterval` | `Integer` | `2` | Optional. The interval for the timeslider
`timeIntervalUnits` | `String` | `esriTimeUnitsYears` | Optional. The interval units for the timeslider
`timeSliderProperties` | `Object` | `{}` | Optional. Additional properties to use for the timeslider. [See the ArcGIS Javascript API](https://developers.arcgis.com/javascript/jsapi/timeslider-amd.html)