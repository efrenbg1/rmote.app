from flask import Flask, request, Blueprint

hub = Blueprint('libs', __name__, template_folder='templates')