from libs import sessions, flask
from flask import request
from libs.flask import socketio, app
from termcolor import colored
import json
import threading
from termcolor import colored
from datetime import datetime
import traceback

logfile = open("error.log", "a", encoding="utf-8")
llogfile = threading.Lock()


@socketio.on_error()
@app.errorhandler(Exception)
def catch(e):
    print(colored("\n[ERROR]", "red", attrs=["bold"]))
    print(traceback.print_exc())
    print("")
    string = str(json.dumps({
        'error': traceback.format_exc(),
        'url': request.url,
        'headers': str(json.dumps(dict(request.headers)))
    }))
    t = datetime.now()
    with llogfile:
        logfile.write("{}/{}/{} {}:{}:{} → {}\n\n".format(t.day,
                                                          t.month, t.year, t.hour, t.minute, t.second, string))
        logfile.flush()
    return "400 (Bad request)", 400


@flask.app.route('/error')
def error():
    if not sessions.check():
        return "401 (Unauthorized)", 401
    err = json.dumps({
        'user': request.cookies.get('Username'),
        'url': request.args.get("sn"),
        'file': request.args.get("fl"),
        'line': request.args.get("ln"),
        'column': request.args.get("cn"),
        'error': request.args.get("err")
    })
    print(colored("\n[JS]", "red", attrs=["bold"]))
    print(request.args.get("err"))
    print("")
    t = datetime.now()
    with llogfile:
        logfile.write("{}/{}/{} {}:{}:{} → {}\n\n".format(t.day,
                                                          t.month, t.year, t.hour, t.minute, t.second, err))
        logfile.flush()
    return request.args.get("i")
