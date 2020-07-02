from modules import modules
from libs import ddbb, sessions, password
from flask import request
import base64
import json
import re


@modules.hub.route('/settings/email')
def settingsEmail():
    if sessions.check(request.cookies):
        try:
            user = request.cookies.get('Username')
            new = base64.b64decode(request.headers.get("new")).decode('utf-8')
            pw = base64.b64decode(request.headers.get("pw")).decode('utf-8')
            if ddbb.checkPW(user, pw):
                if re.match("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$", new):
                    q = ddbb.query(
                        "UPDATE user SET username=%s WHERE username=%s", new, user)
                    if q != None:
                        #ddbb.users.delete(user)
                        #ddbb.sessions.delete(user)
                        return str(json.dumps({'Done': '1'}))
        except Exception as e:
            print(e)
            return "400 (Bad request)", 400
    return "401 (Unauthorized)", 401


@modules.hub.route('/settings/password')
def settingsPassword():
    if sessions.check(request.cookies):
        try:
            user = request.cookies.get('Username')
            pw = base64.b64decode(request.headers.get("pw")).decode('utf-8')
            new = base64.b64decode(request.headers.get("new")).decode('utf-8')
            if ddbb.checkPW(user, pw):
                if re.match("^[A-Za-z0-9_-]*$", new) and 7 < len(new) < 21:
                    q = ddbb.query(
                        "UPDATE user SET pw=%s WHERE username=%s", password.createHash(new), user)
                    if q != None:
                        ddbb.users.delete(user)
                        return str(json.dumps({'Done': '1'}))
        except Exception as e:
            print(e)
        return "400 (Bad request)", 400
    return "401 (Unauthorized)", 401


@modules.hub.route('/settings/destroy')
def settingsDestroy():
    if sessions.check(request.cookies):
        try:
            user = request.cookies.get('Username')
            pw = base64.b64decode(request.headers.get("pw")).decode('utf-8')
            if ddbb.checkPW(user, pw):
                share = ddbb.query(
                    "DELETE FROM share WHERE owner=(SELECT id FROM user WHERE username=%s) OR user=(SELECT id FROM user WHERE username=%s)", user, user)
                if share != None:
                    acls = ddbb.query(
                        "DELETE FROM acls WHERE user=(SELECT id FROM user WHERE username=%s)", user)
                    if acls != None:
                        ddbb.acls.delete(user)
                        account = ddbb.query(
                            "DELETE FROM user WHERE username=%s", user)
                        if account != None:
                            #ddbb.users.delete(user)
                            #ddbb.sessions.delete(user)
                            return str(json.dumps({'Done': '1'}))
        except Exception as e:
            print(e)
        return "400 (Bad request)", 400
    return "401 (Unauthorized)", 401
