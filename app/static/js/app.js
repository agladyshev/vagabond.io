var initialLists = [
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


var List = function(data) {
	this.title = data.title;
	this.id = data.id;
	this.locations = ko.observableArray([]);
	this.categories = ko.observableArray([]);
};


var Category = function(data) {
	this.id = data.id;
	this.name = data.name;
	this.pluralName = data.pluralName;
	this.shortName = data.shortName;
	this.active = ko.observable(true);
};


var Location = function(data) {
	var self = this;
	this.id = data.id;
	this.name = data.name;
	this.phone = data.contact.phone;
	this.rating = data.rating;
	this.address = data.location.address;
	this.LatLng = {lat: data.location.lat, lng: data.location.lng};
	this.categories = ko.computed(function() {
		var categories = [];
		data.categories.forEach(function (category) {
			categories.push( new Category(category))
		});
		return categories;
	}, this);

	self.marker = ko.computed(function() {
		if (map) {
			var marker =  new google.maps.Marker({
				// icon: image,
				position: self.LatLng,
				// animation: google.maps.Animation.DROP
				});
			marker.addListener('click', function() {
				viewModel.openInfoWindow(self);
			});
			return marker;
		}
	}, this);

	this.distance = ko.observable();
	this.duration = ko.observable();
};


var ViewModel = function() {
	var self = this;

	// hardcoded values
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


	this.start = function() {
		self.gpsStatus = ko.observable(null);
		self.currentPosition = ko.observable();
		self.currentPosition.subscribe(function(newPosition) {
			self.getDistance();
		});
		
		self.selectedLocation = ko.observable();
		self.searchQuery = ko.observable();


		self.currentTravelMode = ko.observable( this.travelModes()[0] );
		self.currentOrder = ko.observable( this.listOrders()[0] );

		this.shouldListLocations = ko.observable(false);
		this.shouldShowDirections = ko.observable(false);
		this.gpsError = ko.observable(false);
		// this.shouldShowModal = ko.observable(false);
		self.modalText = ko.observable('');

		self.lists = ko.observableArray([]);
		self.currentList = ko.observable();

		initialLists.forEach(function(list) {
			self.lists.push( new List(list) );
		});

		// Get localstorage data before it is overwritten by computed variables

		if (localStorage.initList) {
			self.initList = JSON.parse(localStorage.initList);
			self.initCategories = JSON.parse(localStorage[self.initList.id]);
		};

		// Set default list and get initial data
		if (self.initList) {
			self.lists().forEach(function(list) {
				if (list.id === self.initList.id) {
					self.setCurrentList(list);
				};
			});
		} else {
			self.setCurrentList(self.lists()[0]);
		};

		self.compute();
	};

	this.setCurrentList = function (list) {
		if (self.currentList()) {
			self.hideMarkers();
			if (localStorage[list.id]) {
				self.initCategories = JSON.parse(localStorage[list.id]);
			};
		};
		self.currentList(list);
		self.getListData(list);
		self.getDistance();
		localStorage.initList = JSON.stringify(list);
	};

	this.getListData = function (list) {
		var callServer = $.ajax(window.location.href + "api/v1.0/list/" + list.id)
			.done(function(response) {
				var data = JSON.parse(response);
				if (!data.response.list) {
					self.openModal("Couldn't get location data from Foursquare. We'll sort this situation shortly.");
				} else {
					data.response.list.listItems.items.forEach(function (location) {
						list.locations.push( new Location(location.venue) );
					});
					self.setListCategories(list);
				};
			})
			.fail(function() {
				self.openModal("Couldn't get location data from Foursquare. We'll sort this situation shortly.");
			});
	};

	this.setListCategories = function(list) {
		var listCategories = [];
		var index = [];
		list.locations().forEach(function(location) {
			location.categories().forEach(function(category) {
				if (index.indexOf(category.id) === - 1) {
					listCategories.push(category);
					index.push(category.id);
				};
			});
		});
		list.categories(listCategories);
		if (self.initCategories) {
			self.setCategoriesFromStorage();
		};
	};

	this.setCategoriesFromStorage = function() {
		var active = self.initCategories;
		var activeIDs = [];
		active.forEach(function(activeLocation) {
			activeIDs.push(activeLocation.id);
		});
		self.currentList().categories().forEach(function(category) {
			if (!activeIDs.includes(category.id)) {
				category.active(false);
			};
		});
	};	

	this.compute = function() {
		self.currentCategories = ko.computed(function() {
			if (self.currentList()) {
				return self.currentList().categories();
			};
		}, this);

		self.activeCategories = ko.computed(function() {
			if (self.currentList() && self.currentList().categories()) {
				var activeCategories = [];
				self.currentList().categories().forEach(function(category) {
					if (category.active()) {
						activeCategories.push(category);
					};
				});
				localStorage.setItem(self.currentList().id, JSON.stringify(activeCategories));
				console.log(JSON.stringify(activeCategories));
				console.log(localStorage[self.currentList().id]);
				return activeCategories;
			};
		}, this);

		self.sortedLocations = ko.computed(function() {
			if (self.currentList()){
				return self.currentList().locations().sort(function (left, right) { 
					var mode = self.currentOrder().mode;
					// var direction = self.currentOrder().direction;
					if (mode !== 'rating' && left[mode]() && right[mode]()) {
						// Check if value has been already assigned
						return left[mode]()['value'] == right[mode]()['value'] ? 0 : (left[mode]()['value'] < right[mode]()['value'] ? -1 : 1)
					} else {
						return left[mode] == right[mode] ? 0 : (left[mode] > right[mode] ? -1 : 1)
					}
				});
			};
		}, this);

		self.activeLocations = ko.computed(function() {
			var activeLocations = [];
			var positions = [];
			self.sortedLocations().forEach(function(location) {
				location.marker().setMap(null);
				location.categories().forEach(function(locationCat) {
					self.activeCategories().forEach(function(category) {
						if (category.id === locationCat.id) {
							activeLocations.push(location);
							location.marker().setMap(map);
							positions.push(location.marker().getPosition());
						};
					});
				});
			});
			if (typeof bounds !== 'undefined') {
				viewMap.fitBounds(positions);
			};
			return activeLocations;
		}, this);

		self.searchResults = ko.computed(function() {
			var searchItems;
			var filteredLocations = [];
			if (self.searchQuery()) {
				searchItems = self.searchQuery().toLowerCase().split(' ', 3);
				self.currentList().locations().forEach(function(location) {
					searchItems.forEach(function(item) {
						if (location.name.toLowerCase().includes(item)) {
							filteredLocations.push(location);
							return;
						};
						if (location.address && location.address.toLowerCase().includes(item)) {
							filteredLocations.push(location);
							return;
						};
						location.categories().forEach(function(category) {
							if (category.name.toLowerCase().includes(item)) {
								filteredLocations.push(location)
								return;
							};
						});

					});
				});
				if (filteredLocations.length) {
					return filteredLocations;
				} else {
					return null;
				}
			}
		});

	};
	this.hideMarkers = function () {
		self.currentList().locations().forEach(function(location) {
			location.marker().setMap(null);
		});
		viewMap.resetBounds();
	};
	this.setTravelMode = function (mode) {
		self.currentTravelMode(mode);
		self.getDistance();
	};
	this.toggleListLocations = function() {
		self.shouldListLocations(!self.shouldListLocations());
	};
	this.toggleCategory = function(category) {
		category.active(!category.active());
	};
	this.toggleGPS = function() {
		self.gpsStatus(null);
		viewMap.toggleGPS();
	};
	this.gpsCallback = function(geoPosition) {
		self.currentPosition(geoPosition);
		self.gpsStatus(true);
	};
	this.gpsErrorEvent = function() {
		if (self.gpsStatus() !== false) {
			self.gpsStatus(false);
			self.openModal("GPS service unavailable. Please try again later.");
		};
	};
	this.getDistance = function() {
		if (self.currentPosition()) {
			self.activeLocations().forEach(function(location) {
				viewMap.getDistance(location, self.currentTravelMode().mode);
			});
		};
	};
	this.setDistance = function(location, result) {
		if (result.status !== 'OK') {
			// location.distance({text: "No route found", value: null});
			// location.duration({text: "No route found", value: null});
		} else {
			location.duration(result.duration);
			location.distance(result.distance);
		};
	};
	this.openInfoWindow = function(location) {
		if (self.searchQuery()) {
			self.searchQuery(null);
		};
		self.selectedLocation(location);
		viewMap.openInfoWindow(location);

		FoundationView.toggleMenu();
	};
	this.orderBy = function(order) {
		if (order.mode !== 'rating' & !self.gpsStatus()) {
			self.openModal('Please turn on GPS');
		} else {
			self.currentOrder(order);
		};
	};
	this.getDirections = function(location) {
		if (!self.gpsStatus()) {
			self.toggleGPS();
		} else {
			viewMap.getDirections(location, self.currentTravelMode().mode);
			self.shouldShowDirections(true);
		}
		
	};
	this.directionsCallback = function(status) {
		if (status !== 'OK') {
			if (status === "ZERO_RESULTS") {
				self.openModal("Couldn't create a route. Try different transport mode.");
			} else {
				self.openModal("Directions are not available at the moment");
			}
			self.closeDirectionsCallback();
		}
	};
	this.closeDirections = function() {
		viewMap.closeDirections();
		viewMap.resumeBounds();
	};
	this.closeDirectionsCallback = function() {
		self.shouldShowDirections(false);
	};
	// this.getUber = function(location) {
	// 	var link = 'https://m.uber.com/ul/?'
	// 	'client_id=<CLIENT_ID>'
	// 	'&action=setPickup&pickup[latitude]=' + location().LatLng.lat +
	// 	'&pickup[longitude]=' + location().LatLng.lng +
	// 	'&pickup[nickname]=' + location.name.replace(/[^\x00-\x7F]/g, "")
	// 	'&pickup[formatted_address]=1455%20Market%20St%2C%20San%20Francisco%2C%20CA%2094103'
	// 	'&dropoff[latitude]=37.802374&dropoff[longitude]=-122.405818&dropoff'
	// 	'[nickname]=Coit%20Tower&dropoff[formatted_address]=1%20Telegraph%20Hill%20Blvd%2C%20San%20Francisco%2C%20CA%2094133'
	// 	'&product_id=a1111c8c-c720-46c3-8534-2fcdd730040d'
	// 	'&link_text=View%20team%20roster'
	// 	'&partner_deeplink=partner%3A%2F%2Fteam%2F9383';
	// };
	this.openModal = function(message) {
		self.modalText(message);
		FoundationView.toggleModal();
	};
	this.closeModal = function() {
		self.modalText('');
		FoundationView.toggleModal();
	}
	this.start();
};


var FoundationView = {
	init: function() {
		$(document).foundation();
	},
	toggleMenu: function() {
		$('#offCanvas').foundation('close');
	},
	toggleModal: function() {
		$('#modal').foundation('toggle');
	}
};


var viewModel = new ViewModel();

// Added deferred option when infowindow updates stopped working after moving to flask
ko.options.deferUpdates = true;

ko.applyBindings(viewModel);

// Foundation is initialized after bindings to map events to knockout created elements
FoundationView.init();