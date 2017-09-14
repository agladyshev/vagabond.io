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
};


var Location = function(data) {
	this.id = ko.observable(data.id);
	this.name = ko.observable(data.name);
	this.phone = ko.observable(data.contact.phone);
	this.rating = ko.observable(data.rating);
	this.lat = ko.observable(data.location.lat);
	this.lng = ko.observable(data.location.lng);
	this.categoryIDs = ko.observableArray([data.categories]);
	// this.categories = ko.observableArray(function(data.categories) {
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

	// console.log(this.currentList().categories());

	this.currentCategories = ko.observable( this.currentList().categories() );

	console.log(this.lists());





	// this.getCategories = function () {
	// 	return self.currentList().categories();
	// };
	// console.log(this.getCategories());


	this.lists().forEach(function(list) {

		$.getJSON("https://api.foursquare.com/v2/lists/"
				+ list.id() + "?client_id=" + FOURSQUARE_CLIENT_KEY
				+ "&client_secret=" + FOURSQUARE_CLIENT_SECRET
				+ "&v=20170913", function(data) {
					// console.log(data.response.list.categories);
					// console.log(list.categories());
					data.response.list.categories.items.forEach(function (category) {
						list.categories.push( new Category(category) );
					});	
					data.response.list.listItems.items.forEach(function (location) {
						list.locations.push( new Location(location.venue) );
					});
					// console.log(list.categories());
					// console.log(list.locations());
				});	
			
		});

	this.setCurrentList = function (list) {
	    self.currentList(list);
	};

	console.log(this.currentCategories());

	this.currentCategories().forEach(function(category) {
		console.log(category);
	});


};


ko.applyBindings(new ViewModel());

$(document).foundation();