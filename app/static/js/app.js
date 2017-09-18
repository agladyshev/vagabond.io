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
	this.categories = ko.computed(function() {
		var list = [];
		var index = [];
		this.locations().forEach(function(location) {
			location.categories().forEach(function(category) {
				if (index.indexOf(category.id) === - 1) {
					list.push(category);
					index.push(category.id);
				}		
			});
		});
		return list;
	}, this);
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

	this.currentPosition = ko.observable();

	this.travelModes = ko.observableArray([
			{title: "Walking", mode: "WALKING"},
			{title: "Driving", mode: "DRIVING"},
			{title: "Transit", mode: "TRANSIT"},
			{title: "Cycling", mode: "BICYCLING"}
		]);

	this.selectedLocation = ko.observable();

	this.gpsStatus = ko.observable(false);

	this.currentTravelMode = ko.observable( this.travelModes()[0] );

	this.lists = ko.observableArray([]);

	this.listOrders = ko.observableArray([
		{title: "Order by rating", mode: 'rating', direction: 'DESC'},
		{title: "Order by duration", mode: 'duration', direction: 'ASC'},
		{title: "Order by distance", mode: 'distance', direction: 'ASC'}
		]);

	this.currentOrder = ko.observable( this.listOrders()[0] );

	initialLists.forEach(function(list) {
		self.lists.push( new List(list) );
	});

	this.currentList = ko.observable( this.lists()[0] );

	self.currentCategories = ko.computed(function() {
		return self.currentList().categories();
	}, this);
	
	this.activeCategories = ko.computed(function() {
		var activeCategories = [];
		self.currentList().categories().forEach(function(category) {
			if (category.active()) {
				activeCategories.push(category);
			};
		});
		return activeCategories;	
	}, this);

	this.sortedLocations = ko.computed(function() {
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
	}, this);

	this.activeLocations = ko.computed(function() {
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

	this.currentPosition.subscribe(function(newPosition) {
		self.getDistance();
	});


	this.lists().forEach(function(list, index) {
		$.getJSON("http://localhost:8000/api/v1.0/list/"
				+ list.id, function(data) {
					data.response.list.listItems.items.forEach(function (location) {
						list.locations.push( new Location(location.venue) );
				});
			});	
		});

	this.searchQuery = ko.observable();

	this.searchResults = ko.computed(function() {
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

	this.setCurrentList = function (list) {
		self.hideMarkers();
		self.currentList(list);
		self.getDistance();
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
	
	this.shouldListLocations = ko.observable(false);

	this.toggleListLocations = function() {
		self.shouldListLocations(!self.shouldListLocations());
	};

	this.toggleCategory = function(category) {
		category.active(!category.active());
	};
	this.toggleGPS = function() {
		self.gpsStatus(!self.gpsStatus());
		viewMap.toggleGPS();
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
			location.distance({text: "No route found"})
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
		console.log(self.selectedLocation());
		console.log(location);
		console.log(document.getElementById('info-content'));
		viewMap.openInfoWindow(location);

		FoundationView.toggleMenu();
	};
	this.orderBy = function(order) {
		if (order.mode !== 'rating' & !self.gpsStatus()) {
			// create modal here
			alert('Please turn on GPS');
		} else {
			self.currentOrder(order);
		};
	};

	this.shouldShowDirections = ko.observable(false);

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
			// create modal here
			if (status === "ZERO_RESULTS") {
				console.log("Couldn't create a route. Try different transport mode.");
			} else {
				console.log("Directions are not available at the moment");
			}
		}
	};
	this.closeDirections = function() {
		viewMap.closeDirections();
		viewMap.resumeBounds();
	};
	this.closeDirectionsCallback = function() {
		self.shouldShowDirections(false);
	};

};

var FoundationView = {
	init: function() {
		$(document).foundation();
	},
	toggleMenu: function() {
		$('#offCanvas').foundation('close');
	}
};

var viewModel = new ViewModel();

// Added deferred option when infowindow updates stopped working after moving to flask
ko.options.deferUpdates = true;

ko.applyBindings(viewModel);

// Foundation is initialized after bindings to map events to knockout created elements
FoundationView.init();