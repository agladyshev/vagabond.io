var map;
var bounds;
var infowindow;
var geoPosition;
var directionsDisplay;

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
	resumeBounds: function() {
		if (bounds) {
			map.fitBounds(bounds);
		}
	},
	openInfoWindow: function(location) {

		this.closeInfoWindow();

		var streetViewService = new google.maps.StreetViewService();
		var radius = 50;

		function getStreetView(data, status) {
			if (status == google.maps.StreetViewStatus.OK) {
				var nearStreetViewLocation = data.location.latLng;
				var heading = google.maps.geometry.spherical.computeHeading(
					nearStreetViewLocation, location.marker().position);
					
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


		// this.infoDiv = function(location) {

		// 	var div = '<div class="grid-container infowindow"><div class="grid-x">' +
		// 		'<div class="cell grid-x">' +
		// 		'<div class="cell small-10"><div class="h5">' + location.name + '</div></div>' +
		// 		'<div class="cell small-2 text-right">' +
		// 		( location.rating ? '<span class="badge">' + location.rating + '</span>' : '' ) + '</div></div>' +
		// 		( location.distance() ? '<div class="cell h6">' + location.distance().text +
		// 		' - ' + location.duration().text + '</div>' : '') + '<div class="cell grid-x button-group tiny">';

		// 	location.categories().forEach(function(category) {
		// 		div += '<div class="cell button shrink">' + category.shortName + '</div>'
		// 	});
		
		// 	div += (location.phone? '<div class="cell shrink button fi-telephone"> ' + location.phone + '</div>': '') +
		// 		'</div><div class="cell infowindow-streetview" id="pano"></div>' +
		// 		'<div class="cell grid-x align-spaced">' +
		// 		'<div id="directions" class="fi-map cell shrink button tiny success"> Get directions</div>' +
		// 		'<div id="directions" class="fi-telephone cell shrink button tiny warning"> Get UBER</div>' +
		// 		'</div></div>'

		// 	return div;
		// };
		// 

		if (!infowindow) {
			infowindow = new google.maps.InfoWindow({});
			infowindow.setContent(document.getElementById('info-content'));
		};

		// var mapDiv = document.getElementById('directions');
		// console.log(mapdiv);

		// google.maps.event.addListener(infowindow, 'domready', function() {
		// 	document.getElementById('directions').addEventListener("click", function() {
		// 		viewModel.getDirections(location);
		// 	});
			
		// });
		
		streetViewService.getPanoramaByLocation(location.marker().position, radius, getStreetView);

		infowindow.open(map, location.marker());
	},
	closeInfoWindow: function() {
		if (infowindow) {
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
			destinations: [location.marker().position],
			travelMode: travelMode,
			unitSystem: google.maps.UnitSystem.METRIC,
		}, function(response, status) {
			if (status !== google.maps.DistanceMatrixStatus.OK) {
				window.alert('Error was: ' + status);
			} else {
				// console.log(response.rows[0].elements[0])
				viewModel.setDistance(location, response.rows[0].elements[0]);
			}
		});
	},
	getDirections: function(location, travelMode) {
		// map.hideMarkers();
		this.closeInfoWindow();
		this.closeDirections();
		var directionsService = new google.maps.DirectionsService;
		directionsService.route({
		origin: {lat: geoPosition.coords.latitude, lng: geoPosition.coords.longitude},
		destination: location.marker().position,
		travelMode: travelMode
		}, function(response, status) {
			if (status === google.maps.DirectionsStatus.OK) {
				directionsDisplay = new google.maps.DirectionsRenderer({
					map: map,
					directions: response,
					draggable: true,
					// polylineOptions: {
					// 	strokeColor: 'green'
					// }
				});
			} else {
				// window.alert('Directions request failed due to ' + status);
			}
			viewModel.directionsCallback(status);
		});
	},
	closeDirections: function() {
		if (directionsDisplay) {
			directionsDisplay.setMap(null);
			// directionsService.setMap(null);
			// directionDisplay.set('directions', null);
		};
		viewModel.closeDirectionsCallback();
	},
};

var initMap = function() {
	viewMap.init();
};


