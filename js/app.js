var initialLists = [
	{
		title: "Yerevan",
		id: "59b9524b95a722030778d8ed"
	},
	{
		title: "Armenia",
		id: "59b957aa3731ee2ab6c2677d"
	}];


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
	this.LatLng = {lat: data.location.lat, lng: data.location.lng};
	this.categories = ko.computed(function() {
		var categories = [];
		data.categories.forEach(function (category) {
			categories.push( new Category(category))
		});
		return categories;
	}, this);
	self.marker = new google.maps.Marker({
        // icon: image,
        position: self.LatLng,
        // animation: google.maps.Animation.DROP
    });
    self.marker.addListener('click', function() {
    	viewMap.openInfoWindow(self);
    });
    // self.marker.addListener('click', toggleBounce);
};


var ViewModel = function() {
	// console.log(map);
	var self = this;

	this.travelModes = ko.observableArray([
		{title: "Walking"},
		{title: "Driving"},
		{title: "Transit"},
		{title: "Cycling"}
	]);
	this.currentTravelMode = ko.observable( this.travelModes()[0] );

	this.lists = ko.observableArray([]);

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

	this.activeLocations = ko.computed(function() {
		var activeLocations = [];
		var positions = [];
		self.currentList().locations().forEach(function(location) {
			location.marker.setMap(null);
			location.categories().forEach(function(locationCat) {
				self.activeCategories().forEach(function(category) {
					if (category.id === locationCat.id) {
						activeLocations.push(location);
						location.marker.setMap(map);
						positions.push(location.marker.getPosition());
					};
				});
			});
		});
		if (typeof bounds !== 'undefined') {
			viewMap.fitBounds(positions);
		};
		return activeLocations;
	}, this);

	this.lists().forEach(function(list, index) {
		$.getJSON("https://api.foursquare.com/v2/lists/"
				+ list.id + "?client_id=" + FOURSQUARE_CLIENT_KEY
				+ "&client_secret=" + FOURSQUARE_CLIENT_SECRET
				+ "&v=20170913", function(data) {
					data.response.list.listItems.items.forEach(function (location) {
						list.locations.push( new Location(location.venue) );
					});
				});	
		});

	this.setCurrentList = function (list) {
		self.hideMarkers();
		self.currentList(list);
	};

	this.hideMarkers = function () {
		self.currentList().locations().forEach(function(location) {
			location.marker.setMap(null);
		});
		viewMap.resetBounds();
	};

	this.setTravelMode = function (mode) {
		self.currentTravelMode(mode);
	};
	
	this.shouldListLocations = ko.observable(false);

	this.toggleListLocations = function() {
		self.shouldListLocations(!self.shouldListLocations());
	};

	this.toggleCategory = function(category) {
		category.active(!category.active());
		// self.activeCategories.pop(category);
	};
	this.search = function(form) {
		console.log(form);
	};
};


ko.applyBindings(new ViewModel());

$(document).foundation();