#Advanced Print Widget

A modified version of the original CMV print widget to allow for the exclusion of layers in the legend printout. The 
widget now builds an array of `esri/tasks/LegendLayer` to send to the print task if configured. If not configured, the widget
falls back to default functionality.

**Motivation**
We use a complex basemap, which when printed to a pdf fills the legend to a point where it causes display issues. 
Since the basemap is not necessary for our needs in the legend, excluding this layer from the legend solves this issue.

