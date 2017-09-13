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
}


var Category = function(data) {
	this.id = ko.observable(data.id);
	this.name = ko.observable(data.name);
	this.pluralName = ko.observable(data.pluralName);
	this.shortName = ko.observable(data.shortName);
}


var Location = function(data) {
	this.id = ko.observable(data.id);
	this.name = ko.observable(data.name);
	this.phone = ko.observable(data.contact.phone);
	this.rating = ko.observable(data.rating);
	this.lat = ko.observable(data.location.lat);
	this.lng = ko.observable(data.location.lng);
}


var ViewModel = function() {
    var self = this;

    this.lists = ko.observableArray([]);

    initialLists.forEach(function(list) {
    	self.lists.push( new List(list) );
    })

    console.log(this.lists()[0].title());

    $.getJSON("https://api.foursquare.com/v2/lists/" + 
    	+ "&client_id=CLIENT_ID&client_secret=CLIENT_SECRET", function(data) {

    })
}


ko.applyBindings(new ViewModel());

$(document).foundation();