from flask import Flask, redirect, render_template
import sys, os, checksumdir
sys.path.insert(0, './libs')
from libs import core, ddbb, password, sessions
from modules import modules, control, manager, settings

app = Flask(__name__, template_folder='static/')
app.register_blueprint(core.hub)
app.register_blueprint(modules.hub)

hash = checksumdir.dirhash(os.path.join(os.getcwd(), 'static'))

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