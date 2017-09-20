var ViewMap = function() {
	var self = this;

	this.map;
	this.bounds;
	this.infowindow;
	this.geoPosition;
	this.directionsDisplay;

	this.init = function() {
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

		self.map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: 40.179186, lng: 44.499103},
			zoom: 12,
			styles: styles,
			disableDefaultUI: true
		});
		self.resetBounds();
	};
	this.resetBounds = function() {
		self.bounds = new google.maps.LatLngBounds();
	};
	this.fitBounds = function(positions) {
		self.resetBounds();
		positions.forEach(function(position) {
			self.bounds.extend(position);
		});
		self.map.fitBounds(self.bounds);
	};
	this.resumeBounds = function() {
		if (self.bounds) {
			self.map.fitBounds(self.bounds);
		}
	};
	this.openInfoWindow = function(location) {

		self.closeInfoWindow();

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
						pitch: 0
					}
				};

				var panorama = new google.maps.StreetViewPanorama(
					document.getElementById('pano'), panoramaOptions);
				
			} else {
				document.getElementById('pano').classList.toggle("infowindow-streetview");
			};
		};
		if (!self.infowindow) {
			self.infowindow = new google.maps.InfoWindow({});
			self.infowindow.setContent(document.getElementById('info-content'));
		};
		
		streetViewService.getPanoramaByLocation(location.marker().position, radius, getStreetView);

		self.infowindow.open(self.map, location.marker());
	};
	this.closeInfoWindow = function() {
		if (self.infowindow) {
			self.infowindow.marker = null;
			self.infowindow.close();
		};
	};
	this.toggleGPS = function() {
		if (self.geoPosition) {
			self.geoPosition = null;
		} else {
			var geoOptions = {
				enableHighAccuracy: false,
				timeout: 10 * 1000,
				maximumAge: 5 * 60 * 1000,
			}
			var geoSuccess = function(position) {
				self.geoPosition = position;
				viewModel.gpsCallback(self.geoPosition);
				// viewModel.currentPosition(self.geoPosition);
			};
			var geoError = function(error) {
				viewModel.gpsErrorEvent();

				console.log('Error occurred. Error code: ' + error.code);
				// error.code can be:
				//   0: unknown error
				//   1: permission denied
				//   2: position unavailable (error response from location provider)
				//   3: timed out
			};
			navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
		};
	};
	this.getDistance = function(location, travelMode) {
		var result;
		var distanceMatrixService = new google.maps.DistanceMatrixService;
		distanceMatrixService.getDistanceMatrix({
			origins: [{lat: self.geoPosition.coords.latitude, lng: self.geoPosition.coords.longitude}],
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
	};
	this.getDirections = function(location, travelMode) {
		// self.map.hideMarkers();
		self.closeInfoWindow();
		self.closeDirections();
		if (!self.geoPosition) {
			viewModel.openModal("GPS service unavailable. Please try again later.");
			viewModel.closeDirectionsCallback();
		} else {
			var directionsService = new google.maps.DirectionsService;
			directionsService.route({
			origin: {lat: self.geoPosition.coords.latitude, lng: self.geoPosition.coords.longitude},
			destination: location.marker().position,
			travelMode: travelMode
			}, function(response, status) {
				if (status === google.maps.DirectionsStatus.OK) {
					self.directionsDisplay = new google.maps.DirectionsRenderer({
						map: self.map,
						directions: response,
						draggable: true,
					});
				} else {
					// window.alert('Directions request failed due to ' + status);
				}
				viewModel.directionsCallback(status);
			});;
		};
	};
	this.closeDirections = function() {
		if (self.directionsDisplay) {
			self.directionsDisplay.setMap(null);
			// directionsService.setMap(null);
			// directionDisplay.set('directions', null);
		};
		viewModel.closeDirectionsCallback();
	};
};

var viewMap = new ViewMap();