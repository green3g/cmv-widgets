define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/ready',
    'dojo/sniff',
    'esri/SpatialReference',
    'esri/geometry/Point'
], function (declare, lang, ready, has, SpatialReference, Point) {
    return declare(null, {
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
        },
    });
});