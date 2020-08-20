from libs import ddbb, sessions, password, mqtls
from libs.flask import socketio
from flask import request
import base64
import json
import re
import random
import string


@socketio.on('/settings/email')
def settingsEmail(h):
    user = request.cookies.get('Username')
    new = h.get('email')
    pw = h.get('pw')
    if new is None or pw is None:
        return "400 (Bad request)", 400
    if not ddbb.checkPW(user, pw):
        return "401 (Unauthorized)", 401
    if not re.match("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$", new):
        return "400 (Bad request)", 400
    q = ddbb.query("SELECT id FROM user WHERE username=%s", new)
    if len(q):
        return "418 (I'm a teapot)", 418
    confirm = ''.join(
        [random.choice(string.ascii_letters + string.digits) for _ in range(64)])
    ddbb.query("UPDATE user SET confirm=%s, confirmType='email', confirmData=%s, confirmValid=now() WHERE username=%s", confirm, new, user)
    return "done"


@socketio.on('/settings/password')
def settingsPassword(h):
    user = request.cookies.get('Username')
    new = h.get('new')
    old = h.get('old')
    if new is None or old is None:
        return "400 (Bad request)", 400
    if len(new) < 8 or len(new) > 20:
        return "400 (Bad request)", 400
    if not ddbb.checkPW(user, old):
        return "401 (Unauthorized)", 401
    ddbb.query("UPDATE user SET pw=%s WHERE username=%s",
               password.createHash(new), user)
    mqtls.user(user)
    mqtls.acls(user)
    return "done"


@socketio.on('/settings/destroy')
def settingsDestroy(h):
    user = request.cookies.get('Username')
    email = h.get('email')
    pw = h.get('pw')
    if email is None or pw is None:
        return "400 (Bad request)", 400
    if not ddbb.checkPW(user, pw):
        return "401 (Unauthorized)", 401

    mqtls.user(user)
    mqtls.acls(user)
    return "done"
