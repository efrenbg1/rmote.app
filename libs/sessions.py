import base64
import time
import json
import string
import os
import random
from libs import ddbb, password, core
from flask import Flask, request


def start(user):
    hash = base64.urlsafe_b64encode(
        bytearray(os.urandom(random.randint(40, 60)))).decode('utf-8')
    with ddbb.lsessions:
        ddbb.sessions[user] = hash
    return hash


@core.hub.route('/login')
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


@core.hub.route('/logout')
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


def check(cookies):
    try:
        with ddbb.lsessions:
            if ddbb.sessions.get(cookies.get('Username')) == cookies.get('Session'):
                return True
    except:
        pass
    return False
