import base64
import json
import os
import random
import threading
from datetime import datetime
from termcolor import colored
from libs import ddbb, limiter
from libs.flask import socketio, app
from flask import request
from flask_socketio import disconnect

sid = {}
lsid = threading.Lock()


@socketio.on('connect')
def on_connect():
    if not limiter.check():
        return False
    if request.cookies.get('Content') != app.hash:
        return False
    if not check():
        return False
    user = request.cookies.get('Username')
    with lsid:
        sids = sid.get(user)
        if sids is None:
            sid[user] = [request.sid]
        else:
            if len(sids) > 4:  # Limit the number of maximum concurrent websockets per user to 5
                return False
            sids.append(request.sid)
            sid[user] = sids
    now = datetime.now()
    log = colored(now.strftime("%H:%M:%S"), 'blue') + " → Socket: " + colored(
        request.remote_addr, "yellow")
    print(log)


@app.route('/check')
def sessionCheck():
    if not limiter.check():
        return "409 (Conflict)", 409
    if request.cookies.get('Content') != app.hash:
        return "205 (Reset Content)", 205
    if not check():
        return "401 (Unauthorized)", 401
    user = request.cookies.get('Username')
    with lsid:
        sids = sid.get(user)
    if sids is not None and len(sids) > 4:
        return "429 (Too Many Requests)", 429
    return "", 200


@socketio.on('disconnect')
def on_disconnect():
    if not check():
        return
    with lsid:
        try:
            sid[request.cookies.get(
                'Username')].remove(request.sid)
        except:
            pass


def start(user):
    hash = base64.urlsafe_b64encode(
        bytearray(os.urandom(random.randint(40, 60)))).decode('utf-8')
    ddbb.query("UPDATE user SET session=%s WHERE username=%s", hash, user)
    return hash


@app.route('/login')
def login():
    if not limiter.check():
        return "409 (Conflict)", 409
    user = request.headers.get('user')
    pw = request.headers.get('pw')
    if user is not None and pw is not None:
        user = base64.b64decode(user).decode('utf-8')
        pw = base64.b64decode(pw).decode('utf-8')
        if ddbb.checkPW(user, pw):
            with lsid:
                sids = sid.get(user)
                sid[user] = []
            if sids is not None:
                socketio.start_background_task(
                    disconnect_user, sids)
            response = {"username": user,
                        "cookie": start(user)}
            return str(json.dumps(response))
    limiter.count(login=True)
    return "403 (Forbidden)", 403


def disconnect_user(sids):
    with app.app_context():
        for e in sids:
            socketio.sleep(0.2)
            try:
                disconnect(e, namespace='/')
            except Exception:
                pass


@app.route('/logout')
def logout():
    if not limiter.check():
        return "409 (Conflict)", 409
    user = request.headers.get('Username')
    hash = request.headers.get('Session')
    if user is None or hash is None:
        return "400 (Bad request)", 400
    session = ddbb.query("SELECT session FROM user WHERE username=%s", user)
    if len(session) > 0:
        session = session[0][0]
    else:
        session = None
    if session != hash:
        return "401 (Unauthorized)", 401
    ddbb.query("UPDATE user SET session=NULL WHERE username=%s", user)
    with lsid:
        sids = sid.get(user)
        try:
            del sid[user]
        except Exception:
            pass
    if sids is not None:
        socketio.start_background_task(
            disconnect_user, sids)
    return """{'done':1}"""


def check():
    user = request.cookies.get('Username')
    hash = request.cookies.get('Session')
    if user is None or hash is None or len(hash) > 150 or len(user) > 50:
        return False
    session = ddbb.query("SELECT session FROM user WHERE username=%s", user)
    if len(session) > 0:
        session = session[0][0]
    else:
        session = None
    if session == hash:
        return True
    limiter.count()
    return False
