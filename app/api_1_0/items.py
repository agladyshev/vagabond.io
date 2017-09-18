from flask import jsonify, request, url_for, current_app
from . import api


@api.route('/list/<int:id>')
def get_item(id):
    return
