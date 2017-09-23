from flask import jsonify, request, url_for, current_app
from . import api
import requests
import json


@api.route('/list/<id>')
def get_list(id):
    # Get list data from Foursquare API
    params = {
        'client_id': current_app.config['FOURSQUARE_CLIENT_ID'],
        'client_secret': current_app.config['FOURSQUARE_CLIENT_SECRET'],
        'v': '20170913',
        'locale': request.headers['Accept-Language'].split(',')[0]
    }
    r = requests.get(
        'https://api.foursquare.com/v2/lists/{}'.format(id),
        params=params)
    return r.text
