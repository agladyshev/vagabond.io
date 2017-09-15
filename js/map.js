var map;
var bounds;
var infowindow;

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
		bounds = new google.maps.LatLngBounds();
	},
	fitBounds: function(positions) {
		this.resetBounds();
		positions.forEach(function(position) {
			bounds.extend(position);
		});
		map.fitBounds(bounds);
	},
	openInfoWindow: function(location) {
		if (infowindow) {
			infowindow.close();
		};
		var infoDiv = '<div>' + location.name +'</div>';
		infowindow = new google.maps.InfoWindow({
		    content: infoDiv
		  });
		infowindow.open(map, location.marker);
	},
};

var initMap = function() {
	viewMap.init();
};