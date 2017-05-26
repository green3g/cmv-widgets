CMV Widgets
===========

Download this branch for a fully functional demo. Note: The demo uses the PHP proxy from esri, and the app settings version that shortens the url using a php script.
If you do not want to install php, configure a different proxy, and modify the `viewer.js` to not use the php script.

[![Join the chat at https://gitter.im/roemhildtg/CMV_Widgets](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/roemhildtg/CMV_Widgets?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Dojo Widgets to extend the functionality of the Esri Javascript API and [CMV](https://github.com/cmv/cmv-app). Documentation on how to use these widgets can be found in their respective folder. While designed to work specifically for CMV, they should function just as well outside of CMV in a different Dojo or Esri API app.


 * Check out the [demo](http://roemhildtg.github.io/cmv-widgets/) for a fully functional demo.
 * View the [source code](https://github.com/roemhildtg/cmv-widgets/tree/gh-pages) in the gh-pages branch.
### AppSettings

* Store and share map and application state.
* [View the Documentation](widgets/AppSettings/):

![URL Field](widgets/AppSettings/appSettings.png)

### RelatedRecordsTable

* Query and display the layers' related records
* [View the Documentation](widgets/RelationshipTable/)

![URL Field](widgets/RelationshipTable/relatedRecords.png)

### MetadataDialog

* Query the layer's rest page and display it's description
* [View the Documentation](widgets/MetadataDialog/)

![URL Field](widgets/MetadataDialog/metadatadialog.png)

### HeatMap Layer

* Toggle a dynamic heatmap renderer on point layers
* [View the Documentation](widgets/HeatMap/)

![URL Field](widgets/HeatMap/heatmap.png)

### Label Layer Creator

* Add labels to dynamic map layers
* [View the Documentation](widgets/LabelLayer/)

![URL Field](widgets/LabelLayer/docs/label.png)

### TimeSlider

* Control the current display of all time enabled layers ont he map
* [View the Documentation](widgets/TimeSlider)

![URL Field](widgets/TimeSlider/timeSlider.png)

### LoginCookie

* Cache logins in a cookie or local storage and reload them when the app starts
* [View the Documentation](widgets/LoginCookie)
