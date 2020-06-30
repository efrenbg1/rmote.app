from flask import Flask
from flask_socketio import SocketIO
import os

template_dir = os.path.abspath('static/')

app = Flask(__name__, template_folder=template_dir)
app.hash = ""
socketio = SocketIO(app, cors_allowed_origins='*')
