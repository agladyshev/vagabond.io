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
	this.title = ko.observable(data.title);
	this.id = ko.observable(data.id);
	this.categories = ko.observableArray([]);
	this.locations = ko.observableArray([]);
};


var Category = function(data) {
	this.id = ko.observable(data.id);
	this.name = ko.observable(data.name);
	this.pluralName = ko.observable(data.pluralName);
	this.shortName = ko.observable(data.shortName);
	this.active = ko.observable(true);
};


var Location = function(data) {
	this.id = ko.observable(data.id);
	this.name = ko.observable(data.name);
	this.phone = ko.observable(data.contact.phone);
	this.rating = ko.observable(data.rating);
	this.lat = ko.observable(data.location.lat);
	this.lng = ko.observable(data.location.lng);
	// this.categoryIDs = ko.observable([data.categories]);
	this.categories = ko.computed(function() {
		var categories = [];
		data.categories.forEach(function (category) {
			categories.push( new Category(category))
		});
		console.log(categories);
		return categories;
	});
	// this.categories = ko.computed(function(data.categories) {
	// 	var catList = [];
	// 	var allCategories = ViewModel.getCategories();
	// 	data.categories.forEach(function(category) {
	// 		catList.push(allCategories.filter)

	// 	});
	// 	return catList;
	// };)
};


var ViewModel = function() {
	var self = this;

	this.lists = ko.observableArray([]);

	initialLists.forEach(function(list) {
		self.lists.push( new List(list) );
	});

	this.currentList = ko.observable( this.lists()[0] );

	self.currentCategories = ko.observableArray([]);
	// self.activeCategories = ko.observableArray([]);
	
	this.travelModes = ko.observableArray([
		{title: "Walking"},
		{title: "Driving"},
		{title: "Transit"},
		{title: "Cycling"}
	]);
	this.currentTravelMode = ko.observable( this.travelModes()[0] );

	this.lists().forEach(function(list, index) {

		$.getJSON("https://api.foursquare.com/v2/lists/"
				+ list.id() + "?client_id=" + FOURSQUARE_CLIENT_KEY
				+ "&client_secret=" + FOURSQUARE_CLIENT_SECRET
				+ "&v=20170913", function(data) {

					data.response.list.categories.items.forEach(function (categories) {
						self.lists()[index].categories.push( new Category(categories.category) );
					});	
					data.response.list.listItems.items.forEach(function (location) {
						list.locations.push( new Location(location.venue) );
					});
					self.currentCategories(self.currentList().categories());
					// self.activeCategories(self.currentCategories());

				});	
			
		});


	this.activeCategories = ko.computed(function() {
		var activeCategories = [];
		self.currentList().categories().forEach(function(category) {
			if (category.active()) {
				activeCategories.push(category);
			};
		});
		return activeCategories;	
	});


	this.activeLocations = ko.computed(function() {
		var activeLocations = [];
		self.currentList().locations().forEach(function(location) {
			location.categories().forEach(function(locationCat) {
				self.activeCategories().forEach(function(category) {
					if (category.id() === locationCat.id()) {
						activeLocations.push(location);
					};
				});
			});
		});
		return activeLocations;
	});


	this.setCurrentList = function (list) {
		self.currentList(list);
		self.currentCategories(self.currentList().categories());
		// self.activeCategories(self.currentCategories());
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
	}



};


ko.applyBindings(new ViewModel());

$(document).foundation();