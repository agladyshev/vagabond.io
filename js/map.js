var map;
var bounds;

var viewMap = {
	init: function() {
		
		map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: 40.179186, lng: 44.499103},
			zoom: 12,
			disableDefaultUI: true

		});
		this.resetBounds();
	},

	resetBounds: function() {
		console.log("reset");
		bounds = new google.maps.LatLngBounds();
	},
	fitBounds: function(positions) {
		this.resetBounds();
		positions.forEach(function(position) {
			bounds.extend(position);
		});
		map.fitBounds(bounds);
	}
};

var initMap = function() {
	viewMap.init();
};