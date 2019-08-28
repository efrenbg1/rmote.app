from flask import Flask, request, Blueprint

hub = Blueprint('modules', __name__, template_folder='templates')