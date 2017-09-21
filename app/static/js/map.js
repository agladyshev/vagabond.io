var ViewMap = function () {
    'use strict';
    var self = this;
    this.init = function () {
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
        ];
        var mapDiv = document.getElementById('map');
        self.map = new google.maps.Map(mapDiv, {
            center: {lat: 40.179186, lng: 44.499103},
            zoom: 12,
            styles: styles,
            disableDefaultUI: true
        });
        self.resetBounds();
        google.maps.event.addDomListener(window, 'resize', function() {
            viewModel.fitBounds();
        });
        google.maps.event.addDomListener(mapDiv, 'click', function() {
            viewModel.searchActive(false);
        });
        viewModel.setMapReady();
    };
    this.resetBounds = function () {
        self.bounds = new google.maps.LatLngBounds();
    };
    this.fitBounds = function (positions) {
        self.resetBounds();
        positions.forEach(function (position) {
            self.bounds.extend(position);
        });
        self.map.fitBounds(self.bounds);
    };
    this.resumeBounds = function () {
        if (self.bounds) {
            self.map.fitBounds(self.bounds);
        }
    };
    this.getInfoWindowContent = function (location) {
        var div = '<div class="grid-container infowindow"><div class="grid-x">' +
            '<div class="cell grid-x">' +
            '<div class="cell small-10"><div class="h5">' + location.name + '</div></div>' +
            '<div class="cell small-2 text-right">' +
            ( location.rating ? '<span class="badge">' + location.rating + '</span>' : '' ) + '</div></div>';

        div += ( location.distance() ? '<div class="cell h6">' + location.distance().text +
            ' - ' + location.duration().text + '</div>' : '') + '<div class="cell grid-x button-group tiny">';

        location.categories().forEach(function(category) {
            div += '<div class="cell button shrink">' + category.shortName + '</div>'
        });

        div += '</div><div class="cell infowindow-streetview" id="pano"></div>';
        
        div += '<div class="cell grid-x button-group tiny align-center">'
        if (self.geoPosition) {
            div += '<a id="directions-button" class="fi-map cell shrink button tiny success" onclick="viewModel.getDirections()"> Get directions</a>'
        } else {
            div += '<a id="geolocation-button" class="fi-marker cell shrink button secondary" onclick="viewModel.toggleGPS()"> Turn on geolocation</a>'
        }

        div += (location.phone? '<a class="cell shrink button fi-telephone"> ' + location.phone + '</a>': '') + '</div>'

        return div;
    };
    this.openInfoWindow = function (location) {
        self.closeInfoWindow();
        if (!self.streetViewService) {
            self.streetViewService = new google.maps.StreetViewService();
            self.panoRadius = 50;
        }
        this.getStreetView = function (data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation,
                    location.marker().position
                );
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 0
                    }
                };
                self.panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'),
                    panoramaOptions
                );
            } else {
                // panorama must have a specified height, so we have to hide it
                document.getElementById('pano').classList.toggle("infowindow-streetview");
            }
        };
        self.infowindow = new google.maps.InfoWindow({
            content: self.getInfoWindowContent(location)
            });
        self.streetViewService.getPanoramaByLocation(location.marker().position, self.panoRadius, self.getStreetView);
        self.infowindow.open(self.map, location.marker());
    };
    this.updateInfoWindow = function(location) {
        self.infowindow.setContent(self.getInfoWindowContent(location));
        self.streetViewService.getPanoramaByLocation(location.marker().position, self.panoRadius, self.getStreetView);
    };
    this.closeInfoWindow = function () {
        if (self.infowindow) {
            // self.infowindow.marker = null;
            self.infowindow.content = '';
            self.infowindow.close();
        }
    };
    this.toggleGPS = function () {
        if (self.geoPosition) {
            self.geoPosition = null;
        } else {
            var geoOptions = {
                enableHighAccuracy: false,
                timeout: 10 * 1000,
                maximumAge: 5 * 60 * 1000
            };
            var geoSuccess = function (position) {
                self.geoPosition = position;
                viewModel.gpsCallback(self.geoPosition);
                // viewModel.currentPosition(self.geoPosition);
            };
            var geoError = function (error) {
                viewModel.gpsErrorEvent();

                console.log('Error occurred. Error code: ' + error.code);
                // error.code can be:
                //   0: unknown error
                //   1: permission denied
                //   2: position unavailable (error response from location provider)
                //   3: timed out
            };
            navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
        }
    };
    this.getDistance = function (location, travelMode) {
        var distanceMatrixService = new google.maps.DistanceMatrixService();
        distanceMatrixService.getDistanceMatrix({
            origins: [{lat: self.geoPosition.coords.latitude, lng: self.geoPosition.coords.longitude}],
            destinations: [location.marker().position],
            travelMode: travelMode,
            unitSystem: google.maps.UnitSystem.METRIC
        }, function (response, status) {
            if (status !== google.maps.DistanceMatrixStatus.OK) {
                window.alert('Error was: ' + status);
            } else {
                // console.log(response.rows[0].elements[0])
                viewModel.setDistance(location, response.rows[0].elements[0]);
            }
        });
    };
    this.getDirections = function (location, travelMode) {
        // self.map.hideMarkers();
        self.closeInfoWindow();
        self.closeDirections();
        if (!self.geoPosition) {
            viewModel.openModal("GPS service unavailable. Please try again later.");
            viewModel.closeDirectionsCallback();
        } else {
            var directionsService = new google.maps.DirectionsService();
            directionsService.route({
                origin: {lat: self.geoPosition.coords.latitude, lng: self.geoPosition.coords.longitude},
                destination: location.marker().position,
                travelMode: travelMode
            }, function (response, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    if (!self.directionsDisplay) {
                        self.directionsDisplay = new google.maps.DirectionsRenderer({
                            map: self.map,
                            directions: response,
                            draggable: true
                        });    
                    } else {
                        self.directionsDisplay.setDirections(response);
                        self.directionsDisplay.setMap(self.map);
                    }
                } else {
                    // window.alert('Directions request failed due to ' + status);
                }
                viewModel.directionsCallback(status);
            });
        }
    };
    this.closeDirections = function () {
        if (self.directionsDisplay) {
            self.directionsDisplay.setMap(null);
        }
        viewModel.closeDirectionsCallback();
    };
};

var viewMap = new ViewMap();