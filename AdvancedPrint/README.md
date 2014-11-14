#Advanced Print Widget

A modified version of the original CMV print widget to allow for the exclusion of layers in the legend printout. The 
widget now builds an array of `esri/tasks/LegendLayer` to send to the print task if configured. If not configured, the widget
falls back to default functionality.

**Motivation:**
We use a complex basemap, which when printed to a pdf fills the legend to a point where it causes display issues. 
Since the basemap is not necessary for our needs in the legend, excluding this layer from the legend solves this issue.

##Config:
```JavaScript
	print: {
include: true,
id: 'print',
type: 'titlePane',
canFloat: true,
path: 'gis/dijit/Print',
title: 'Print',
open: false,
position: 6,
options: {
map: true,
printTaskURL: 'https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task',
copyrightText: 'Copyright 2014',
authorText: 'Me',
defaultTitle: 'Viewer Map',
defaultFormat: 'PDF',
defaultLayout: 'Letter ANSI A Landscape',
//additions:
dpi: 300, //default dpi
legendLayers: [] //array of layer ids to include, leave null to exclude

}
}
```

**Note: this has not been thoroughly tested, use at your own risk.**
