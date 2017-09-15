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

		var streetViewService = new google.maps.StreetViewService();
		var radius = 50;

		function getStreetView(data, status) {
			if (status == google.maps.StreetViewStatus.OK) {
				console.log(location.marker.position);
				console.log(data.location.latLng);
				var nearStreetViewLocation = data.location.latLng;
				var heading = google.maps.geometry.spherical.computeHeading(
					nearStreetViewLocation, location.marker.position);
					
				var panoramaOptions = {
					position: nearStreetViewLocation,
					pov: {
						heading: heading,
						pitch: 30
					}
				};

				var panorama = new google.maps.StreetViewPanorama(
					document.getElementById('pano'), panoramaOptions);
				
			} else {
				document.getElementById('pano').classList.toggle("infowindow-streetview");
			};
		};


		this.infoDiv = function(location) {
			

			var div = '<div class="grid-container infowindow"><div class="grid-x">' +
				'<div class="cell grid-x">' +
				'<div class="cell small-10"><div class="h5">' + location.name + '</div></div>' +
				'<div class="cell small-2 text-right">' +
				( location.rating? '<span class="badge">' + location.rating + '</span>' : '' ) + '</div>' +
				'</div><div class="cell grid-x button-group tiny">';

			location.categories().forEach(function(category) {
				div += '<div class="cell button shrink">' + category.shortName + '</div>'
			});

			div += (location.phone? '<div class="cell shrink button fi-telephone"> ' + location.phone + '</div>': '') +
				'</div><div class="cell infowindow-streetview" id="pano"></div></div>'

			return div;
		};

		console.log(this.infoDiv(location));
		infowindow = new google.maps.InfoWindow({
			content: this.infoDiv(location)
		  });
		

		streetViewService.getPanoramaByLocation(location.marker.position, radius, getStreetView);

		infowindow.open(map, location.marker);
	},
	closeInfoWindow: function() {
		if (infowindow) {
			infowindow.close();
		};
	}
};

var initMap = function() {
	viewMap.init();
};