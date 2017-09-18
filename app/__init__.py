from flask import Flask
from config import config


def create_app(config_name):
    # create app

    app = Flask(__name__, static_folder='static', static_url_path='')
    # configure app
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    # provide https support
    if not app.debug and not app.testing and not app.config['SSL_DISABLE']:
        from flask_sslify import SSLify
        sslify = SSLify(app)

    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)
    from .api_1_0 import api as api_1_0_blueprint
    app.register_blueprint(api_1_0_blueprint, url_prefix='/api/v1.0')

    return app
