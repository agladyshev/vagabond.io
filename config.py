import os
basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    # FOURSQUARE_CLIENT_KEY = os.environ.get('FOURSQUARE_CLIENT_KEY')
    # FOURSQUARE_CLIENT_SECRET = os.environ.get('FOURSQUARE_CLIENT_SECRET')
    FOURSQUARE_CLIENT_KEY = '2ZRPUR41OGI5WY0QZZL4G3NJQW2FWVQUZR1MOHTAX10MDDS3'
    FOURSQUARE_CLIENT_SECRET = 'HBQQJ3QZ1AVWMTQDFFBEDOT4YYQDI5GTBDT25ELSMYWZDR32'

    @staticmethod
    # configuration-specific initialization
    def init_app(app):
        pass


class DevelopmentConfig(Config):
    DEBUG = True


class HerokuConfig(Config):

    SSL_DISABLE = bool(os.environ.get('SSL_DISABLE'))

    @classmethod
    def init_app(cls, app):
        ProductionConfig.init_app(app)

        # handle proxy server headers
        from werkzeug.contrib.fixers import ProxyFix
        app.wsgi_app = ProxyFix(app.wsgi_app)

        # log to stderr
        import logging
        from logging import StreamHandler
        file_handler = StreamHandler()
        file_handler.setLevel(logging.WARNING)
        app.logger.addHandler(file_handler)


config = {
    'development': DevelopmentConfig,
    'heroku': HerokuConfig,
    'default': DevelopmentConfig
}
