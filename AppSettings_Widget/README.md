AppSettings
===============

CMV Version: 1.3.1

A widget designed for use in CMV that allows the user to save the current 
state of the map extent and visible layers. It also provides functionality to share the 
current state of the application via a url. 
Additional functionality using Topic.subscribe and Topic.publish 
allows widget developers to save additional settings.

##Description:
Allows the user to save the current state of the map extent and visible layers
using html5 localStorage. 
Also allows the user to 'share' a current snapshot of the map state with others via email client.
 
![URL Field](https://github.com/roemhildtg/CMV_Widgets/blob/master/AppSettings_Widget/URL_Screenshot.PNG)
 
![URL Field](https://github.com/roemhildtg/CMV_Widgets/blob/master/AppSettings_Widget/Widget_screenshot.PNG)

##Usage 
In viewer.js (see below for descriptions of parameters): 
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
     appSettings: {},
     parametername: 'cmvSettings',
     mapRightClickMenu: true,
     address: 'email@email.com',
     subject: 'Share Map',
     body: 'Check out this map! <br /> '
     emailSettings: ['saveMapExtent', 'savelayerVisibility'],
     shareNode: ''
     //shareTemplate: ''
    }
}
```

Options Parameters:
==================
Key | Type | Default | Description
---|---|---|---
map | - | - | In CMV config set to true to include map
layerInfos | - | - | In CMV config, set layerControlLayerInfos to true to include layerInfos
mapRightClickMenu | - | - | In CMV config, set to true to add a right click menu option for sharing the map
appSettings | object | `{}` | Additional app settings to be stored, by default map extent and layer visibility are saved, widget developers may add more
parameterName | string | 'cmvSettings' | Name of the parameter stored in localStorage and via url
emailSettings | array | `['saveMapExtent', 'saveLayerVisibility']` | Keys of the settings that will be included in the Share Map email link
shareNode | string or domNode | '' | an optional domnode to place a link to share map
shareTemplate | html template string | `<a href="#"><i class="fa fa-fw fa-envelope-o"></i>Share Map</a>` | The html template that will be placed at the shareNode
address | string | '' | the default email address in the Share Map email
subject | string | 'Share map' | the default subject in the Share Map email
body | string | '' | the default body message in the Share Map email

##Developing
- See: http://dojotoolkit.org/reference-guide/1.10/dojo/topic.html
- Storing a custom value in the appSettings widget can be used to set and retrieve values in localStorage and via url when the user clicks 'Share Map'.
- Add key to appSettings option parameter array
- Use topic.publish to save your value, and topic.subscrive to retrieve it when the widget loads. 
- To add your custom saved value to the email link, add the key to the emailSettings option parameter array (also include the default ones)

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

##Changes

12/19/2014: 
* Settings will now load after other widgets are ready. IE 9 was throwing errors when the settings were loaded before.
* Continuous url saving has been removed to allow for compatibility with the navigation hash widget, and other widgets using the hash. To share via url, the share map button can be used.
