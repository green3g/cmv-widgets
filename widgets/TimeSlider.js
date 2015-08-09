define([
	'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dojo/_base/lang',
    'dojo/_base/array',
    'esri/TimeExtent', 
    'esri/dijit/TimeSlider',
    'dijit/_Container'
], function(declare, _WidgetBase, lang, array, TimeExtent, TimeSlider, _Container) {
	return declare([_WidgetBase, _Container], {
		map: null,
		startTime: new Date('1/1/1921'),
		endTime: new Date('12/31/2016'),
		timeSlider: null,
		timeExtent: null,
		timeInterval: 2,
		timeIntervalUnits: 'esriTimeUnitsYears',
		timeSliderProperties: {},
		postCreate: function() {
			this.inherited(arguments);
			if(!this.map){
				return false;
			}
			this.timeSlider = new TimeSlider(lang.mixin({
				style: 'width:100%;'
			}, this.timeSliderProperties));
			this.map.setTimeSlider(this.timeSlider);
			this.timeExtent = lang.mixin(new TimeExtent(), {
				startTime: this.startTime,
				endTime: this.endTime
			});
			this.timeSlider.setThumbCount(2);
			this.timeSlider.createTimeStopsByTimeInterval(
				this.timeExtent, 
				this.timeInterval, 
				this.timeIntervalUnits
			);
			this.timeSlider.setThumbIndexes([0,1]);
			this.timeSlider.setThumbMovingRate(2000);
			this.addChild(this.timeSlider);
		}, 
		startup: function() {
			this.inherited(arguments);
			this.timeSlider.startup();
			this.setLabels();
		},
		setLabels: function() {
			//add labels for every other time stop
			var labels = array.map(this.timeSlider.timeStops, function(timeStop, i) { 
				if ( i % 2 === 0 ) {
					return timeStop.getUTCFullYear(); 
				} else {
					return "";
				}
			}); 
			this.timeSlider.setLabels(labels);

		}
	});
});