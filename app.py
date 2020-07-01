from modules import modules, control, manager, settings, register
from libs import core, ddbb, password, sessions, error
from libs.flask import app, socketio, template_dir
from flask import redirect, render_template, request, send_from_directory
import sys
import os
import checksumdir
from jsmin import jsmin
from termcolor import colored
from datetime import datetime
import werkzeug

minimal = True
if "-nominify" in sys.argv:
    minimal = False


print(colored('Compiling JS...', 'magenta'), end="")
tempMin = ""
for file in os.listdir('static/js/sections'):
    with open('static/js/sections/' + file, 'r') as f:
        tempMin += jsmin(f.read()) if minimal else f.read()
with open('static/sections.min.js', "w") as f:
    f.write(tempMin)
tempMin = ""
for file in os.listdir('static/js/libs'):
    with open('static/js/libs/' + file, 'r') as f:
        tempMin += jsmin(f.read()) if minimal else f.read()
with open('static/js/index.js', 'r') as f:
    tempMin += jsmin(f.read()) if minimal else f.read()
with open('static/libs.min.js', "w") as f:
    f.write(tempMin)
tempMin = ""
app.hash = checksumdir.dirhash(
    os.path.join(os.getcwd(), 'static'))[0:4]
print(colored('done', 'green'))


@app.before_request
def before_request_func():
    now = datetime.now()
    log = colored(now.strftime("%H:%M:%S"), 'blue') + " → " + request.path
    print(log)


@app.route('/')
def index():
    return render_template('index.html', hash=app.hash)


@app.route('/index.html')
def redirectNoFile():
    return redirect('/')


@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(template_dir, path)


@app.errorhandler(404)
def not_found(e):
    return render_template('index.html', hash=app.hash)


@app.errorhandler(werkzeug.exceptions.MethodNotAllowed)
def handle_bad_request(e):
    return """<img src="https://meme.xyz/uploads/posts/t/45972-you-have-no-power-here.jpg">"""


if __name__ == '__main__':
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    socketio.run(app, host='0.0.0.0', port=80)
