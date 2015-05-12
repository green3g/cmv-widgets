define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/ready',
    'dojo/sniff',
    'esri/SpatialReference',
    'esri/geometry/Point'
], function (declare, lang, ready, has, SpatialReference, Point) {
    return declare(null, {
        init: function () {
            this.inherited(arguments);
            if (this._appSettings.saveMapExtent.save ||
                    this._appSettings.saveMapExtent.urlLoad) {
                //once the saved map has finished zooming, set the handle
                var handle = this.map.on('zoom-end', lang.hitch(this, function () {
                    handle.remove();
                    this._setExtentHandles();
                }));
                //other widgets need to be ready to listen to extent
                //changes in the map
                ready(2, this, '_loadSavedExtent');
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
            var center = this._appSettings.saveMapExtent.value.center;
            var point = new Point(center.x, center.y, new SpatialReference({
                wkid: center.spatialReference.wkid
            }));
            if (has('ie')) {
                //work around an ie bug
                setTimeout(lang.hitch(this, function () {
                    this.map.centerAndZoom(point,
                            this._appSettings.saveMapExtent.value.zoom);
                }), 800);
            } else {
                this.map.centerAndZoom(point,
                        this._appSettings.saveMapExtent.value.zoom);
            }
            //reset url flag
            this._appSettings.saveMapExtent.urlLoad = false;
        },
        _setExtentHandles: function () {
            this._appSettings.saveMapExtent.value = {};
            this.own(this.map.on('extent-change', lang.hitch(this, function () {
                this._appSettings.saveMapExtent.value.center = this.map.extent.getCenter();
                this._appSettings.saveMapExtent.value.zoom = this.map.getZoom();
                this._saveAppSettings();
            })));
        }
    });
});