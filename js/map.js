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

		// var streetViewService = new google.maps.StreetViewService();
		// var radius = 50;
		// // In case the status is OK, which means the pano was found, compute the
		// // position of the streetview image, then calculate the heading, then get a
		// // panorama from that and set the options
		// function getStreetView(location, status) {
		//   if (status == google.maps.StreetViewStatus.OK) {
		//     var nearStreetViewLocation = location.latLng;
		//     var heading = google.maps.geometry.spherical.computeHeading(
		//       nearStreetViewLocation, marker.position);
		//       infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
		//       var panoramaOptions = {
		//         position: nearStreetViewLocation,
		//         pov: {
		//           heading: heading,
		//           pitch: 30
		//         }
		//       };
		//     var panorama = new google.maps.StreetViewPanorama(
		//       document.getElementById('pano'), panoramaOptions);
		//   } else {
		//     infowindow.setContent('<div>' + marker.title + '</div>' +
		//       '<div>No Street View Found</div>');
		//   }
		// }
		// // Use streetview service to get the closest streetview image within
		// // 50 meters of the markers position
		// streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);


		this.infoDiv = function(location) {
			var div = '<div class="grid-container infowindow"><div class="grid-x">' +
				'<div class="cell grid-x">' +
				'<div class="cell auto">' + location.name + '</div>' +
				'<div class="cell shrink text-right"><span class="badge">' + location.rating + '</span></div>' +
				'</div><div class="cell shrink grid-x">';
			location.categories().forEach(function(category) {
				div += '<div class="cell label shrink">' + category.shortName + '</div>'
			});
			div += '</div><div class="cell">' + (location.phone? location.phone : '')  + '</div></div>'

			return div;
		};
		console.log(this.infoDiv(location));
		infowindow = new google.maps.InfoWindow({
			content: this.infoDiv(location)
		  });
		infowindow.open(map, location.marker);
	},
};

var initMap = function() {
	viewMap.init();
};