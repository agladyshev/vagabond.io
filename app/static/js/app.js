var initialLists = [
    // To retrieve Foursquare list id, call User endpoint with author ID
    // For future: retrieve lists if user log in with Foursquare account
    {
        title: "Yerevan",
        id: "59b9524b95a722030778d8ed"
    },
    {
        title: "Armenia",
        id: "59b957aa3731ee2ab6c2677d"
    },
    {
        title: "Yuzhnaya",
        id: "59be39f8588e366046f70c96"
    }
];


var List = function (data) {
    'use strict';
    this.title = data.title;
    this.id = data.id;
    this.locations = ko.observableArray([]);
    this.categories = ko.observableArray([]);
};


var Category = function (data) {
    'use strict';
    this.id = data.id;
    this.name = data.name;
    this.pluralName = data.pluralName;
    this.shortName = data.shortName;
    this.active = ko.observable(true);
};


var Location = function (data) {
    'use strict';
    var self = this;
    this.id = data.id;
    this.name = data.name;
    this.phone = data.contact.phone;
    this.rating = data.rating;
    this.address = data.location.address;
    this.LatLng = {lat: data.location.lat, lng: data.location.lng};
    // Fousquare's venue can be tagged by multiple categories
    this.categories = ko.computed(function () {
        var categories = [];
        data.categories.forEach(function (category) {
            categories.push(new Category(category));
        });
        return categories;
    }, this);
    self.marker = ko.computed(function () {
        if (viewMap.map) {
            var marker = new google.maps.Marker({
                // icon: image,
                position: self.LatLng,
                animation: google.maps.Animation.DROP,
                title: self.name
            });
            marker.addListener('click', function () {
                viewModel.openInfoWindow(self);

            });
            return marker;
        }
    }, this);
    this.distance = ko.observable();
    this.duration = ko.observable();
};


var ViewModel = function () {
    'use strict';
    var self = this;

    self.travelModes = ko.observableArray([
        {title: "Walking", mode: "WALKING"},
        {title: "Driving", mode: "DRIVING"},
        {title: "Transit", mode: "TRANSIT"},
        {title: "Cycling", mode: "BICYCLING"}
    ]);

    self.listOrders = ko.observableArray([
        {title: "Order by rating", mode: 'rating', direction: 'DESC'},
        {title: "Order by duration", mode: 'duration', direction: 'ASC'},
        {title: "Order by distance", mode: 'distance', direction: 'ASC'}
    ]);

    this.start = function () {
        self.mapReady = ko.observable(false);
        self.gpsStatus = ko.observable(null);
        // gpsStatus has three possible values:
        // true when set, false if there is an error, null if undefined
        self.currentPosition = ko.observable(null);
        // self.currentPosition.subscribe(function (newPosition) {
        //  self.getDistance();
        // });

        self.selectedLocation = ko.observable();
        self.searchQuery = ko.observable();
        self.searchActive = ko.observable(false);
        self.resultsVisible = ko.observable(false);
        // Delay is set to prevent clicking on invisible element
        self.searchActive.subscribe(function(newValue) {
            if (!newValue) {
                setTimeout(function () {
                    self.resultsVisible(false);
                }, 100);
            } else {
                self.resultsVisible(true);
            }
        });

        self.currentTravelMode = ko.observable(this.travelModes()[0]);
        self.currentOrder = ko.observable(this.listOrders()[0]);

        // isLoading toggles loading spinner for directions call
        self.isLoading = ko.observable(false);
        self.shouldListLocations = ko.observable(false);
        self.shouldShowDirections = ko.observable(false);
        self.modalText = ko.observable('');

        self.lists = ko.observableArray([]);
        self.currentList = ko.observable();
        self.markersPositions = ko.observableArray([]);

        initialLists.forEach(function (list) {
            self.lists.push(new List(list));
        });

        // Get localstorage data before it is overwritten by computed variables

        if (localStorage.initList) {
            self.initList = JSON.parse(localStorage.initList);
            if (localStorage[self.initList.id]) {
                self.initCategories = JSON.parse(localStorage[self.initList.id]);
            }
        }

        // Set default list and get initial data
        if (self.initList) {
            self.lists().forEach(function (list) {
                if (list.id === self.initList.id) {
                    self.setCurrentList(list);
                }
            });
        } else {
            self.setCurrentList(self.lists()[0]);
        }
        // Load computed variables
        self.compute();
        FoundationView.showDynamic();
    };

    this.setCurrentList = function (list) {
        // If we change lists
        if (self.currentList()) {
            self.hideMarkers(self.currentList());
            if (localStorage[list.id]) {
                self.initCategories = JSON.parse(localStorage[list.id]);
            }
        }
        // Always
        self.currentList(list);
        self.getListData(list);
        if (self.mapReady() && viewMap.geoPosition) {
            self.getDistance();
        }
        localStorage.initList = JSON.stringify(list);
    };

    this.getListData = function (list) {
        // If list data has already been loaded, use it
        if (list.locations().length) {
            self.setListCategories(list);
            return;
        }
        // else get data from server
        $.ajax(window.location.href + "api/v1.0/list/" + list.id)
            .done(function (response) {
                var data = JSON.parse(response);
                if (!data.response.list) {
                    self.openModal("Couldn't get location data from Foursquare. We'll sort this situation shortly.");
                } else {
                    data.response.list.listItems.items.forEach(function (location) {
                        list.locations.push(new Location(location.venue));
                    });
                    self.setListCategories(list);
                }
            })
            .fail(function () {
                self.openModal("Couldn't get location data from Foursquare. We'll sort this situation shortly.");
            });
    };

    this.setListCategories = function (list) {
        var listCategories = [];
        var index = [];
        // List categories are created from categories mentioned in list locations
        // Therefore function checks if category is unique
        list.locations().forEach(function (location) {
            location.categories().forEach(function (category) {
                if (index.indexOf(category.id) === -1) {
                    listCategories.push(category);
                    index.push(category.id);
                }
            });
        });
        list.categories(listCategories);
        // If localstorage contains data about active categories, load it
        if (self.initCategories) {
            self.setCategoriesFromStorage();
        }
    };

    this.setCategoriesFromStorage = function () {
        // LocalStorage contains active categories from last session
        var active = self.initCategories;
        var activeIDs = [];
        active.forEach(function (activeLocation) {
            activeIDs.push(activeLocation.id);
        });
        self.currentList().categories().forEach(function (category) {
            if (!activeIDs.includes(category.id)) {
                category.active(false);
            }
        });
    };

    this.compute = function () {
        // All the computed observables
        self.positionMarker = ko.computed(function () {
            if (self.currentPosition()) {
                var marker = new google.maps.Marker({
                    position: {lat: viewMap.geoPosition.coords.latitude, lng: viewMap.geoPosition.coords.longitude},
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        strokeColor: '#2ba6cb',
                        scale: 7
                    },
                    animation: google.maps.Animation.DROP,
                    title: 'Your location'
                });
                marker.setMap(viewMap.map);
                return marker;
            } else {
                return null;
            }
        });
        self.currentCategories = ko.computed(function () {
            if (self.currentList()) {
                return self.currentList().categories();
            }
        }, this);
        self.activeCategories = ko.computed(function () {
            // Filter categories selected by user
            if (self.currentList() && self.currentList().categories()) {
                var activeCategories = [];
                self.currentList().categories().forEach(function (category) {
                    if (category.active()) {
                        activeCategories.push(category);
                    }
                });
                if (self.currentList().categories().length) {
                    // We check if list categories are already initialized
                    // then we update localstorage
                    // otherwise we might push empty values
                    localStorage.setItem(self.currentList().id, JSON.stringify(activeCategories));
                }
                return activeCategories;
            }
        }, this);
        self.sortedLocations = ko.computed(function () {
            // Sort locations by current sorting order
            if (self.currentList()) {
                return self.currentList().locations().sort(function (left, right) {
                    var mode = self.currentOrder().mode;
                    // var direction = self.currentOrder().direction;
                    if (mode !== 'rating' && left[mode]() && right[mode]()) {
                        // Check if value has been already assigned
                        return left[mode]().value === right[mode]().value ? 0
                            : (left[mode]().value < right[mode]().value ? -1
                                : 1);
                    } else {
                        return left[mode] === right[mode] ? 0
                            : (left[mode] > right[mode] ? -1
                                : 1);
                    }
                });
            }
        }, this);
        self.searchResults = ko.computed(function () {
            // Calculate possible locations based on user string in search
            var searchItems;
            var initialLocations = self.currentList().locations();
            var filteredLocations = [];
            if (self.searchQuery()) {
                searchItems = self.searchQuery().toLowerCase().split(' ', 3);
                // App use only first 3 substrings: possibly name, address and category

                var properties = {
                    "name": {"found": false, "matches": 0},
                    /*"address": {"found": false, "matches": 0},*/
                    "cat": {"found": false, "matches": 0}
                };
                searchItems.forEach(function (item) {
                    // We filter results by each added substring
                    filteredLocations = [];
                    initialLocations.forEach(function (location) {
                        if (!properties.name.found && location.name.toLowerCase().includes(item)) {
                            filteredLocations.push(location);
                            properties.name.matches += 1;
                            return;
                        }
                        // if (!properties.address.found && location.address && location.address.toLowerCase().includes(item)) {
                        //     filteredLocations.push(location);
                        //     properties.address.matches += 1;
                        //     return;
                        // }
                        if (!properties.cat.found) {
                            location.categories().forEach(function (category) {
                                if (category.name.toLowerCase().includes(item)) {
                                    filteredLocations.push(location);
                                    properties.cat.matches += 1;
                                    return;
                                }
                            });
                        }
                    });
                    initialLocations = filteredLocations;

                    // If one property is mentioned in most filtered results
                    // The next round ignores it

                    let max = 0;
                    let found = '';
                    let match = '';

                    for (var property in properties) {
                        if (properties.hasOwnProperty(property)) {
                            if (properties[property].matches > max) {
                                max = properties[property].matches;
                                found = property;
                            } else if (properties[property].matches === max) {
                                match = property;
                            }
                            properties[property].matches = 0;
                        }
                    }
                    if (found && !match) {
                        properties[property].found = true;
                    }
                });

                if (filteredLocations.length) {
                    return filteredLocations;
                } else {
                    return null;
                }
            } else {
                return initialLocations;
            }
        });
        self.activeLocations = ko.computed(function () {
           
            // Active locations have at least one active category
            var activeLocations = [];
            var positions = [];
            if ((self.searchActive() || self.searchQuery()) && self.searchResults()) {
                self.searchResults().forEach(function (location) {
                    if (location.marker()) {
                        positions.push(location.marker().getPosition());
                    }
                    activeLocations.push(location);
                });
            } else {
                self.sortedLocations().forEach(function (location) {
                    location.categories().forEach(function (locationCat) {
                        self.activeCategories().forEach(function (category) {
                            if (category.id === locationCat.id) {
                                activeLocations.push(location);
                                if (location.marker()) {
                                    positions.push(location.marker().getPosition());
                                }
                            }
                        });
                    });
                });
            }
            // If user locations is set, add it to positions array to set new map bounds
            if (self.currentPosition()) {
                positions.push(self.positionMarker().getPosition());
            }
            if (self.mapReady() && positions.length) {
                self.markersPositions(positions);
                // Computed observables first evaluated before map is loaded
                if (typeof viewMap.bounds !== 'undefined') {
                    viewModel.fitBounds();
                }
                self.showMarkers(activeLocations);
            }
            return activeLocations;
            
        }, this);


    };
    this.fitBounds = function () {
        viewMap.fitBounds(self.markersPositions());
    };
    this.hideMarkers = function (list) {
        list.locations().forEach(function (location) {
            if (location.marker()) {
                location.marker().setMap(null);
            }
        });
        // viewMap.resetBounds();
    };
    this.showMarkers = function (newList) {
        // When new list is loaded, hide all markers and load new
        // Most tasks are async, so have to make sure only current markers are loaded
        self.lists().forEach(function (list) {
            self.hideMarkers(list);
        });
        newList.forEach(function (location) {
            location.marker().setMap(viewMap.map);
        });
    };
    this.setTravelMode = function (mode) {
        self.currentTravelMode(mode);
        self.getDistance();
    };
    this.toggleListLocations = function () {
        self.shouldListLocations(!self.shouldListLocations());
    };
    this.toggleCategory = function (category) {
        category.active(!category.active());
    };
    this.toggleGPS = function () {
        self.gpsStatus(null);
        viewMap.toggleGPS();
    };
    this.gpsCallback = function (geoPosition) {
        self.currentPosition(geoPosition);
        self.gpsStatus(true);
        self.getDistance();
    };
    this.gpsErrorEvent = function () {
        // GPS service makes several attempts to get locations
        // User gets error message only once
        if (self.gpsStatus() !== false) {
            self.gpsStatus(false);
            self.openModal("GPS service unavailable. Please try again later.");
        }
    };
    this.getDistance = function () {
        // Call map view to calculate distance / duration for every location
        if (self.currentPosition()) {
            self.activeLocations().forEach(function (location) {
                viewMap.getDistance(location, self.currentTravelMode().mode);
            });
        }
    };
    this.setDistance = function (location, result) {
        // Callback function, sets distance/duration for location
        if (result.status !== 'OK') {
            // location.distance({text: "No route found", value: null});
            // location.duration({text: "No route found", value: null});
        } else {
            location.duration(result.duration);
            location.distance(result.distance);
        }
        // If infowindow for locations is opened, render it again to update distance value
        if (viewMap.infowindow && viewMap.infowindow.anchor.title === location.marker().title) {
            viewMap.updateInfoWindow(location);
        }
    };
    this.openInfoWindow = function (location) {
        if (!self.mapReady()) {
            self.openModal("There was an error loading Google Map. Please, try again later");
            return;
        }
        // Empty search query if link opened from search results
        if (self.searchQuery()) {
            self.searchQuery(null);
        }
        self.selectedLocation(location);
        self.animateMarker(location);
        viewMap.openInfoWindow(location);
        FoundationView.toggleMenu();
    };
    this.animateMarker = function (location) {
        location.marker().setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            location.marker().setAnimation(null);
        }, 1400);
    };
    this.orderBy = function (order) {
        if (order.mode !== 'rating' && !self.gpsStatus()) {
            self.openModal('Please turn on GPS');
        } else {
            self.currentOrder(order);
        }
    };
    this.getDirections = function (location) {
        // if function is called from infowindow, set location to infowindow location
        if (!location) {
            location = self.selectedLocation();
        }
        self.isLoading(true);
        if (!self.gpsStatus()) {
            self.toggleGPS();
        } else {
            viewMap.getDirections(location, self.currentTravelMode().mode);
            self.shouldShowDirections(true);
        }
    };
    this.directionsCallback = function (status) {
        self.isLoading(false);
        if (status !== 'OK') {
            if (status === "ZERO_RESULTS") {
                self.openModal("Couldn't create a route. Try different transport mode.");
            } else {
                self.openModal("Directions are not available at the moment");
            }
            self.closeDirectionsCallback();
        }
    };
    this.closeDirections = function () {
        viewMap.closeDirections();
        viewMap.resumeBounds();
    };
    this.closeDirectionsCallback = function () {
        self.shouldShowDirections(false);
    };

    // Uber function (in work)
    // this.getUber = function (location) {
    //  var link = 'https://m.uber.com/ul/?'
    //  'client_id=<CLIENT_ID>'
    //  '&action=setPickup&pickup[latitude]=' + location().LatLng.lat +
    //  '&pickup[longitude]=' + location().LatLng.lng +
    //  '&pickup[nickname]=' + location.name.replace(/[^\x00-\x7F]/g, "")
    //  '&pickup[formatted_address]=1455%20Market%20St%2C%20San%20Francisco%2C%20CA%2094103'
    //  '&dropoff[latitude]=37.802374&dropoff[longitude]=-122.405818&dropoff'
    //  '[nickname]=Coit%20Tower&dropoff[formatted_address]=1%20Telegraph%20Hill%20Blvd%2C%20San%20Francisco%2C%20CA%2094133'
    //  '&product_id=a1111c8c-c720-46c3-8534-2fcdd730040d'
    //  '&link_text=View%20team%20roster'
    //  '&partner_deeplink=partner%3A%2F%2Fteam%2F9383';
    // };

    this.openModal = function (message) {
        // Opens modal for warnings and error messages for user
        self.modalText(message);
        FoundationView.toggleModal();
    };
    this.closeModal = function () {
        self.modalText('');
        FoundationView.toggleModal();
    };
    this.mapFailure = function () {
        self.openModal("There was an error loading Google Map. Please, try again later");
        self.mapReady(false);
    };
    this.setMapReady = function () {
        self.mapReady(true);
    };
    this.start();
};


var FoundationView = {
    init: function () {
        'use strict';
        $(document).foundation();
    },
    toggleMenu: function () {
        'use strict';
        // Toggle the bottom menu
        $('#offCanvas').foundation('close');
    },
    toggleModal: function () {
        'use strict';
        // Opens modal window
        $('#modal').foundation('toggle');
    },
    showDynamic: function () {
        'use strict';
        // Prevents SFOUC on load
        $("body").toggleClass('no-js');
    }
};


var viewModel = new ViewModel();


// Added deferred option when infowindow updates stopped working after moving to flask
ko.options.deferUpdates = true;

ko.applyBindings(viewModel);

// Foundation is initialized after bindings
// to map Foundation events to knockout created elements
FoundationView.init();