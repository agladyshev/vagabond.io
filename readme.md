# [vagabond.io](https://vagabond-io.herokuapp.com/)
Vagabond is an interactive tourist map. The app loads multiple location lists from Fousquare and puts markers for the current list on the custom built Google Map. The user can filter locations by categories and sort them by Foursquare rating. If the user provides access to his geolocation, the app can sort places by distance / travel time. The map support multiple travel modes and can provide user with directions. When the user clicks on the marker, the infowindow pops up with a nearest StreetView to the marker. The app also features dynamic search bar which looks up places by name, category and address.

Vagabond.io is built with knockout.js for automatic UI refresh and data manipulation and styled with Foundation CSS. The application is mostly client-side, but in order to secure Foursquare API credentials, calls to Foursquare are made through server.  

To launch locally:
- Get API keys from [Foursquare](https://developer.foursquare.com)
- Open Terinal in the project repository
- Create virtual environment `virtualenv venv`
- Activate virtual environment `source venv/bin/activate`
- Install dependencies `pip install -r requirements.txt`
- Set up environment variables with `export FOURSQUARE_CLIENT_ID=*`, `export FOURSQUARE_CLIENT_SECRET=*`
- Start server with `gunicorn manage:app`
- Open `localhost:5000` in your browser
- If google maps are not working, get you own Google Maps API key and change the key in the index.html