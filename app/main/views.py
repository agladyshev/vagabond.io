from flask import send_from_directory
from . import main


@main.route('/', methods=['GET'])
def index():
    return send_from_directory('static', 'index.html')
