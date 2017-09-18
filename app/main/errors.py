from flask import redirect, url_for
from . import main


@main.app_errorhandler(404)
def page_not_found(e):
    return redirect(url_for('.index'))
