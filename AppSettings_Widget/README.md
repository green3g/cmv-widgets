AppSettings
===============

CMV Version: 1.3.1

A widget designed for use in CMV that allows the user to save the current 
state of the map extent and visible layers.
Additional functionality using Topic/subscribe and Topic/publish 
allows widget developers to save additional settings. **This has not yet been tested.**

##Description:
Allows the user to save the current state of the map extent and visible layers
using html5 localStorage or URL.
 
![URL Field](https://github.com/roemhildtg/CMV_Widgets/blob/master/AppSettings_Widget/URL_Screenshot.PNG)
 
![URL Field](https://github.com/roemhildtg/CMV_Widgets/blob/master/AppSettings_Widget/Widget_screenshot.PNG)

##Usage 
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
    //required:
     map: true,
     layerControlLayerInfos: true,

     //optional: 
     mapRightClickMenu: true,
     address: 'email@email.com',
     subject: 'Share Map',
     body: 'Check out this map! <br /> '

    }
}
```

##Developing
See: http://dojotoolkit.org/reference-guide/1.10/dojo/topic.html

###Storing a setting:
```javascript
//writes the object value to the appSettings[key] and stores it in localStorage
Topic.publish('AppSettings/setValue', key, value);
```

###Retrieving a value when the widget is loaded:
```javascript
//waits for the settings to be loaded and prints the appSettings object
Topic.subscribe('AppSettings/onSettingsLoad', Lang.hitch(this, function (appSettings) {
    console.log(appSettings)
}));
```
Note: the `appSettings` object is a clone of the internal data structure

License: MIT
