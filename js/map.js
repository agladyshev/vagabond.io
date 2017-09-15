var map;
var bounds;
var infowindow;

var viewMap = {
	init: function() {
		var styles = [
		{
			"featureType": "administrative",
			"elementType": "all",
			"stylers": [
				{
					"visibility": "simplified"
				}
			]
		},
		{
			"featureType": "landscape",
			"elementType": "geometry",
			"stylers": [
				{
					"visibility": "simplified"
				},
				{
					"color": "#fcfcfc"
				}
			]
		},
		{
			"featureType": "poi",
			"elementType": "geometry",
			"stylers": [
				{
					"visibility": "simplified"
				},
				{
					"color": "#fcfcfc"
				}
			]
		},
		{
			"featureType": "road.highway",
			"elementType": "geometry",
			"stylers": [
				{
					"visibility": "simplified"
				},
				{
					"color": "#dddddd"
				}
			]
		},
		{
			"featureType": "road.arterial",
			"elementType": "geometry",
			"stylers": [
				{
					"visibility": "simplified"
				},
				{
					"color": "#dddddd"
				}
			]
		},
		{
			"featureType": "road.local",
			"elementType": "geometry",
			"stylers": [
				{
					"visibility": "simplified"
				},
				{
					"color": "#eeeeee"
				}
			]
		},
		{
			"featureType": "water",
			"elementType": "geometry",
			"stylers": [
				{
					"visibility": "simplified"
				},
				{
					"color": "#dddddd"
				}
			]
		}
	]
		
		map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: 40.179186, lng: 44.499103},
			zoom: 12,
			styles: styles,
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