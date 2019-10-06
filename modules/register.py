from modules import modules
from libs import ddbb, sessions, password
from flask import Flask, request
import base64, json, string, re


@modules.hub.route('/register')
def register():
    try:
        user = base64.b64decode(request.headers.get("email")).decode('utf-8').lower()
        pw = base64.b64decode(request.headers.get("pw")).decode('utf-8')
        mac = request.headers.get("mac").upper()
        q = ddbb.query("SELECT * FROM boards WHERE mac=%s LIMIT 1", mac)
        if q[0][0] == mac: #check if board exists
            if re.match("^[A-Za-z0-9_-]*$", pw) and 7 < len(pw) < 21 and re.match("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$", user):
                q = ddbb.query("SELECT id, pw FROM user WHERE username=%s", user)
                if len(q) == 0: #new user
                    q = ddbb.query('SELECT user FROM acls WHERE mac=%s', mac)
                    if len(q) == 0:
                        insert = ddbb.insert('INSERT INTO user (username, pw) VALUES (%s, %s)', user,
                                             password.createHash(pw))
                        if insert != None:
                            q = ddbb.insert("INSERT INTO acls (mac, user, name, cluster) VALUES (%s, %s, 'Unnamed', 0)",
                                            mac, insert)
                            if q != None:
                                return str(json.dumps({'Done': '1'}))
                elif q[0][1] == "": #pending for registration
                    q = ddbb.query('SELECT mac FROM share WHERE user=%s', q[0][0])
                    if q[0][0] == mac: #user pending and its mac match
                        update = ddbb.query('UPDATE user SET pw=%s WHERE username=%s', password.createHash(pw), user)
                        if update != None:
                            return str(json.dumps({'Done': '1'}))
    except Exception as e:
        print(e)
        pass
    return "400 (Bad request)", 400