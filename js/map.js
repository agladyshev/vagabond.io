var viewMap = {
	init: function() {
		var map;
		map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: 40.7413549, lng: -73.9980244},
			zoom: 12,
			disableDefaultUI: true
		});
	}
};

var initMap = function() {
	viewMap.init();
};