from modules import modules, control, manager, settings, register
from libs import core, ddbb, password, sessions
from libs.flask import app, socketio, template_dir
from flask import Flask, redirect, render_template, request, send_from_directory
import sys
import os
import checksumdir
import jsmin
from termcolor import colored
from datetime import datetime
import werkzeug
import traceback


print('Minifying JS...')
tempMin = ""
for file in os.listdir('static/js/sections'):
    with open('static/js/sections/' + file, 'r') as f:
        tempMin += jsmin.jsmin(f.read(), quote_chars="'\"`")
with open('static/js/sections.min.js', "w") as f:
    f.write(tempMin)
tempMin = ""
for file in os.listdir('static/js/libs'):
    with open('static/js/libs/' + file, 'r') as f:
        tempMin += jsmin.jsmin(f.read(), quote_chars="'\"`")
with open('static/js/libs.min.js', "w") as f:
    f.write(tempMin)
hash = checksumdir.dirhash(os.path.join(os.getcwd(), 'static'))[0:4]
print("Hash: " + hash)


@app.before_request
def before_request_func():
    now = datetime.now()
    log = colored(now.strftime("%H:%M:%S"), 'blue') + " → " + request.path
    print(log)


@app.route('/')
def index():
    return render_template('index.html', hash=hash)


@app.route('/index.html')
def redirectNoFile():
    return redirect('/')


@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(template_dir, path)


@app.errorhandler(404)
def not_found(e):
    return render_template('index.html', hash=hash)


@app.errorhandler(werkzeug.exceptions.MethodNotAllowed)
def handle_bad_request(e):
    return """<img src="https://meme.xyz/uploads/posts/t/45972-you-have-no-power-here.jpg">"""


@socketio.on_error()
@app.errorhandler(Exception)
def catch(e):
    print(colored("\n[ERROR]", "red", attrs=["bold"]))
    print(traceback.print_exc())
    print("")
    return "400 (Bad request)", 400


if __name__ == '__main__':
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    socketio.run(app, host='0.0.0.0', port=80)
