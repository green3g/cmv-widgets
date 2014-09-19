AppSettings
===============

CMV Version: 1.2.0

A widget designed for use in CMV that allows the user to save the current state of the map extent and visible layers.

This widget is currently in beta stage, as it has not been thoroughly tested yet. 
Since localStorage is used, <b>clear cache in between updates. Otherwise, updates may break existing app.</b>
Feel free to contact me with bugs and I will fix them as time permits.

<h3>Description:</h3>
Allows the user to save the current state of the map extent and visible layers
using html5 localStorage or URL.
 
![URL Field](https://github.com/roemhildtg/CMV_Widgets/blob/master/AppSettings_Widget/URL_Screenshot.PNG)
 
![URL Field](https://github.com/roemhildtg/CMV_Widgets/blob/master/AppSettings_Widget/Widget_screenshot.PNG)

 
<h3>Limitations: </h3>

<h3>Known Bugs</h3>
The existing TOC widget does not check to see if layer visibility has been changed, so when this widget loads and refreshes the map to previous layers, the TOC does not update.

<h3>Usage </h3>
In viewer.js: 
```javascript      
settings: {
    include: true,
    id: 'settings',
    position: 10,
    type: 'titlePane',
    path: 'gis/dijit/AppSettings',
    title: 'Save/Share Current Map',
    options: {
        map: true,
        tocLayerInfos: true
    }
}
```

Optionally, place it somewhere else, like in the help dijit:
HelpDialog.html: add another content pane to tab widget
```html
...
<div data-dojo-type="dijit/layout/ContentPane" title="Settings">
    <div id="settingsDijit" 
         data-dojo-type="gis/dijit/AppSettings"
         data-dojo-props="map: this.map, layerInfos: this.layerInfos"></div>
</div>
...
```
Help.js: tell dojo to include the additional AppSettings widget
```javascript
define([
    //...other includes here
    'gis/dijit/AppSettings'
], function (//other objects here...
         AppSettings
        ) {
 ```
 Copyright (C) 2014 
 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
