var map;
var bounds;
var infowindow;
var geoPosition;

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
		}];

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
		this.closeInfoWindow();

		var streetViewService = new google.maps.StreetViewService();
		var radius = 50;

		function getStreetView(data, status) {
			if (status == google.maps.StreetViewStatus.OK) {
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
				( location.rating ? '<span class="badge">' + location.rating + '</span>' : '' ) + '</div></div>' +
				( location.distance() ? '<div class="cell h6">' + location.distance() + ' - ' + location.duration() + '</div>' : '') + '<div class="cell grid-x button-group tiny">';

			location.categories().forEach(function(category) {
				div += '<div class="cell button shrink">' + category.shortName + '</div>'
			});
        
			div += (location.phone? '<div class="cell shrink button fi-telephone"> ' + location.phone + '</div>': '') +
				'</div><div class="cell infowindow-streetview" id="pano"></div>' + 
				'</div>'

			return div;
		};

		infowindow = new google.maps.InfoWindow({
			content: this.infoDiv(location)
		  });
		

		streetViewService.getPanoramaByLocation(location.marker.position, radius, getStreetView);

		infowindow.open(map, location.marker);
	},
	closeInfoWindow: function() {
		if (infowindow) {
			infowindow.setContent('');
			infowindow.marker = null;
			infowindow.close();
		};
	},
	toggleGPS: function() {
		if (geoPosition) {
			geoPosition = null;
		} else {
			var geoOptions = {
				enableHighAccuracy: false,
				timeout: 10 * 1000,
				maximumAge: 5 * 60 * 1000,
			}
			var geoSuccess = function(position) {
				geoPosition = position;
				console.log(geoPosition.coords.latitude);
				console.log(geoPosition.coords.longitude);
				console.log(geoPosition);
				viewModel.currentPosition(geoPosition);
			};
			var geoError = function(error) {
				console.log('Error occurred. Error code: ' + error.code);
				// error.code can be:
				//   0: unknown error
				//   1: permission denied
				//   2: position unavailable (error response from location provider)
				//   3: timed out
			};
			navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
		};
	},
	getDistance: function(location, travelMode) {
		var result;
		var distanceMatrixService = new google.maps.DistanceMatrixService;
		distanceMatrixService.getDistanceMatrix({
			origins: [{lat: geoPosition.coords.latitude, lng: geoPosition.coords.longitude}],
			destinations: [location.marker.position],
			travelMode: travelMode,
			unitSystem: google.maps.UnitSystem.METRIC,
		}, function(response, status) {
			if (status !== google.maps.DistanceMatrixStatus.OK) {
				window.alert('Error was: ' + status);
			} else {
				result = response.rows[0].elements[0];
				if (result.status !== "OK") {
					viewModel.setDistance(location, 'No route found');
				} else {
					var distance = {
						distance: result.distance.text,
						duration: result.duration.text
					};
					viewModel.setDistance(location, distance);
				};
			}
		});
		
	}
};

var initMap = function() {
	viewMap.init();
};


