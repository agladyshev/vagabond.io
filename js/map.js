var map;
var bounds;

var viewMap = {
	init: function() {
		
		map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: 40.179186, lng: 44.499103},
			zoom: 12,
			disableDefaultUI: true

		});

		bounds = new google.maps.LatLngBounds();
		// console.log(bounds);
	},	
	resetBounds: function() {
		bounds = new google.maps.LatLngBounds();
	}
};

var initMap = function() {
	viewMap.init();
};