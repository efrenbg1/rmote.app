from modules import modules, control, manager, settings, register
from libs import core, ddbb, password, sessions
from flask import Flask, redirect, render_template
import sys
import os
import checksumdir
import jsmin
sys.path.insert(0, './libs')

app = Flask(__name__, template_folder='static/')
app.register_blueprint(core.hub)
app.register_blueprint(modules.hub)

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


@app.route('/')
def index():
    return render_template('index.html', hash=hash)


@app.route('/index.html')
def redirectNoFile():
    return redirect('/')


@app.route('/<path:path>')
def static_files(path):
    return app.send_static_file(path)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, threaded=True)
