import base64
import time
import json
import string
import os
import random
import threading
from datetime import datetime
from termcolor import colored
from libs import ddbb, password, core
from libs.flask import socketio, app
from flask import Flask, request

sid = {}
lsid = threading.Lock()


@socketio.on('connect')
def on_connect():
    # TODO Poner comprobación de versión
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
    # TODO Poner comprobación de versión
    # if request.cookies.get('Content') != settings.hash:
    #    return "205 (Reset Content)", 205
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
    with ddbb.lsessions:
        ddbb.sessions[user] = hash
    return hash


@app.route('/login')
def login():
    try:
        user = request.headers.get('Username')
        pw = request.headers.get('Password')
        if user is not None and pw is not None:
            user = base64.b64decode(user).decode('utf-8')
            pw = base64.b64decode(pw).decode('utf-8')
            if ddbb.checkPW(user, pw):
                response = {"Username": user,
                            "Cookie": start(user), "Permissions": []}
                return str(json.dumps(response))
    except Exception as e:
        print(e)
        pass
    return "403 (Forbidden)", 403


@app.route('/logout')
def logout():
    try:
        user = request.cookies.get('Username')
        hash = request.cookies.get('Session')
        if user is not None and hash is not None:
            with ddbb.lsessions:
                if ddbb.sessions.get(user) == hash:
                    del ddbb.sessions[user]
        return """{'Done':1}"""
    except Exception:
        pass
    return "401 (Unauthorized)", 401


def check():
    user = request.cookies.get('Username')
    hash = request.cookies.get('Session')
    if user is None or hash is None:
        return False
    with ddbb.lsessions:
        if ddbb.sessions.get(user) == hash:
            return True
    return False
