# Login Cookie

A simple local storage or cookie cache for Esri Identity Manager credentials. This dojo class listens for new credentials added to an esri identity manager and caches them in local storage or a cookie if local storage is not supported. When the widget is constructed, it automatically checks for stored credentials in the cookie and if it finds them, will preload them into the Identity Manager. This will save your users from having to login every time they visit the app.

## Usage

```javascript
//put this somewhere before your app starts trying to load layers
require(['widgets/LoginCookie'], function(LoginCookie){
      (new LoginCookie({
        //optional: specify the key for local storage or cookie name
        //key: 'my_credentials'
      }));
});

//or inside a module:
define(['widgets/LoginCookie'], function(LoginCookie){
      (new LoginCookie({
        //optional: specify the key for local storage or cookie name
        //key: 'my_credentials'
      }));

      return {};
});
```
