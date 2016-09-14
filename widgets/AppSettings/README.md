# AppSettings

A widget designed for use in dojo applications like CMV (v1.3.3) which allows the user to save the current state of the application including map extent and visible layers. It also provides functionality to share the current state of the application via a url.

## Features:

- Allow the user to save the current state of the map extent and visible layers using html5 localStorage.
- Allow the user to 'share' a current snapshot of the map state with others via email client.
- Integrate with other widgets to allow additional properties to be saved in the application and shared
- Includes a simple PHP script which shortens urls

## Usage

Copy the AppSettings.js and AppSettings folder into your relevent directory. (In CMV, this is `gis/dijit/..`)

In viewer.js (see below for descriptions of parameters):

```javascript
settings: {
    include: true,
    id: 'settings',
    position: 10,
    type: 'titlePane',
    path: 'path/AppSettings',
    title: 'Save/Share Current Map',
    options: {

    //these options are required:
     map: true,
     layerControlLayerInfos: true,

     //not required unless you want to add additional settings to save
     appSettings: {
      yourSetting: {
      label: 'Your Other Setting to save',
      checkbox: true,
      save: true
    }
     },

     //these options are not required (defaults are shown):
     parametername: 'cmvSettings',
     mapRightClickMenu: true,
     address: 'email@email.com',
     subject: 'Share Map',
     body: 'Check out this map! <br /> ',
     emailSettings: ['saveMapExtent', 'saveLayerVisibility'],
     shareNode: null,
     shareTemplate: '<a href="#"><i class="fa fa-fw fa-envelope-o"></i>Share Map</a>',
     server: null //setting this may require a proxy
    }
}
```

If you're not using the CMV App, configure `dojoConfig` variable and create the widget using a constructor:

```javascript
require(["esri/map", "esri/layers/ArcGISDynamicMapServiceLayer", 'widgets/AppSettings', "dojo/domReady!"], function (Map, Dynamic, Settings) {
    var map = new Map("map", {
        basemap: "topo", //For full list of pre-defined basemaps, navigate to http://arcg.is/1JVo6Wd
        center: [-94.75290067627297, 39.034671990514816], // long, lat
        zoom: 12,
    });
    var demographicsLayerURL = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer";
    var demographicsLayerOptions = {
        "id": "demographicsLayer",
        "opacity": 0.8,
        "showAttribution": false
    };

    var demographicsLayer = new Dynamic(demographicsLayerURL, demographicsLayerOptions);
    map.addLayer(demographicsLayer);

    //here we create a Settings widget in the domNode '#settings'
    //by passing the layerInfos and the map object
    var settings = new Settings({
        layerInfos: [{
            layer: demographicsLayer
        }],
        map: map
        //other options
    }, 'settings');
});
```

## Options Parameters:

Key               | Type                 | Default                                                           | Description
----------------- | -------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------
map               | -                    | -                                                                 | In CMV config set to true to include map
layerInfos        | -                    | -                                                                 | In CMV config, set layerControlLayerInfos to true to include layerInfos
mapRightClickMenu | -                    | -                                                                 | In CMV config, set to true to add a right click menu option for sharing the map
appSettings       | object               | `{}`                                                              | Additional app settings to be stored, by default map extent and layer visibility are saved, widget developers may add more (see below)
parameterName     | string               | 'cmvSettings'                                                     | Name of the parameter stored in localStorage and via url
emailSettings     | array                | `['saveMapExtent', 'saveLayerVisibility']`                        | Keys of the settings that will be included in the Share Map email link
shareNode         | string or domNode    | ''                                                                | an optional domnode to place a link to share map
shareTemplate     | html template string | `<a href="#"><i class="fa fa-fw fa-envelope-o"></i>Share Map</a>` | The html template that will be placed at the shareNode
address           | string               | ''                                                                | the default email address in the Share Map email
subject           | string               | 'Share map'                                                       | the default subject in the Share Map email
body              | string               | ''                                                                | the default body message in the Share Map email
server            | string               | null                                                              | URL to a save/get json script. [See below](#avoiding-long-urls-when-sharing-the-map)

### appSettings Parameter:

Key      | Type    | Default | Description
-------- | ------- | ------- | ------------------------------------------------------------------
save     | boolean | -       | a flag to identify whether or not this value should be saved
value    | object  | -       | the current value that is saved for this setting
checkbox | boolean | -       | whether the user should have a checkbox displayed for this setting
label    | string  | -       | the checkbox label

## Developing

Storing a custom value in the appSettings widget can be used to set and retrieve values in localStorage and via url when the user clicks 'Share Map'. If the url becomes too long, a web server url should be provided, such as the attached php script.

- First, see <http://dojotoolkit.org/reference-guide/1.10/dojo/topic.html> to find out how dojo/topic works.
- Add key to appSettings option parameter array
- In your widget, use topic.subscribe (example below) in the postCreate or startup function to load the values that were saved.
- In your widget, use topic.publish (example below) to save your value any time it changes.
- To add your custom saved value to the email link, add the key to the emailSettings option parameter array (also include the default ones). Note: this may result in a very long url depending on how big your setting value is.

### Storing a setting:

```javascript
//writes the object value to the appSettings[key] and stores it in localStorage
Topic.publish('AppSettings/setValue', key, value);
```

### Retrieving a value when the widget is loaded:

```javascript
//waits for the settings to be loaded and prints the appSettings object
Topic.subscribe('AppSettings/onSettingsLoad', Lang.hitch(this, function (appSettings) {
   //appSettings is a clone of the entire data structure, if your setting is saved
   //it will be directly accessible via appSettings.mySetting

   //if your using the checkbox, then the following is relevant
   if(appSettings.mySetting && //make sure it exists
   (appSettings.mySetting.save || //the user had the checkbox checked
    appSettings.mySetting.urlLoad) //the user has loaded a url with this setting in it
    ) {
     console.log(appSettings.mySetting);
     }
}));
```

Note: the `appSettings` object is a clone of the internal data structure

### Avoiding long urls when sharing the map

A php script has been included in the php folder that allows for retrieving and setting values via POST or GET requests. AppSettings widget can now accept a `server: 'http://pathtoscript/index.php'` option which will be used to generate a shorter url and allow for more information to be saved when the user clicks "Share Map".

This script is currently set up to store saved maps in a sqlite3 database. This requires the enabling allowing read/write permissions on the php folder.

IMPORTANT: This php script has not been tested for security purposes and it is not recommended to place this in any public facing server. Use at your own risk!

## Changes

8/1/2016:

- Check for setVisibleLayers function on a layer. Tiled layers have visibleLayers property, but not the setVisibleLayers function.

4/27/2015:

- When sharing via url, the length of the url may become extremely long. This widget is now configured to handle sharing and retrieval via POST using a web server. A sample php script is packaged in the php folder

12/19/2014:

- Settings will now load after other widgets are ready. IE 9 was throwing errors when the settings were loaded before.
- Continuous url saving has been removed to allow for compatibility with the navigation hash widget, and other widgets using the hash. To share via url, the share map button can be used.

License: MIT
