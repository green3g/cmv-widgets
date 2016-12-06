define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/ready',
    'dojo/sniff',
    'esri/SpatialReference',
    'esri/geometry/Point',
    'dojo/topic'
], function (declare, lang, ready, has, SpatialReference, Point, topic) {
    return declare(null, {
        extentWaitForReady: true,
        postCreate: function () {
            this.inherited(arguments);
            if (!this.map) {
                topic.publish('viewer/handleError', {
                    source: 'AppSettings',
                    error: 'map is required'
                });
                return;
            }
            this._defaultAppSettings.mapExtent = {
                save: false,
                value: {},
                checkbox: true,
                label: 'Save Map Extent',
                urlLoad: false
            };
        },
        init: function () {
            this.inherited(arguments);
            if (!this._appSettings.mapExtent) {
                return;
            }
            if (this._appSettings.mapExtent.save ||
        this._appSettings.mapExtent.urlLoad) {
        //once the saved map has finished zooming, set the handle
                var handle = this.map.on('zoom-end', lang.hitch(this, function () {
                    handle.remove();
                    this._setExtentHandles();
                }));
                //other widgets need to be ready to listen to extent
                //changes in the map
                if (this.extentWaitForReady) {
                    ready(2, this, '_loadSavedExtent');
                } else {
                    this._loadSavedExtent();
                }
            } else {
                this._setExtentHandles();
            }
        },
    /**
     * recovers the saved extent from the _appSettings object
     * if the settings's save or urlLoad property is true
     */
        _loadSavedExtent: function () {
      //load map extent
            var center = this._appSettings.mapExtent.value.center;
            var point = new Point(center.x, center.y, new SpatialReference({
                wkid: center.spatialReference.wkid
            }));
            if (has('ie')) {
        //work around an ie bug
                setTimeout(lang.hitch(this, function () {
                    this.map.centerAndZoom(point,
            this._appSettings.mapExtent.value.zoom);
                }), 800);
            } else {
                this.map.centerAndZoom(point,
          this._appSettings.mapExtent.value.zoom);
            }
      //reset url flag
            this._appSettings.mapExtent.urlLoad = false;
        },
        _setExtentHandles: function () {
            this._appSettings.mapExtent.value = {};
            this.own(this.map.on('extent-change', lang.hitch(this, function () {
                this._appSettings.mapExtent.value.center = this.map.extent.getCenter();
                this._appSettings.mapExtent.value.zoom = this.map.getZoom();
                this._saveAppSettings();
            })));
        }
    });
});
