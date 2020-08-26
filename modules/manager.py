from libs import ddbb, mqtls
from libs.email import registerShare
from flask import request
from libs.flask import socketio
from datetime import timedelta
import re
import random
import string
import time


@socketio.on('/manager/list')
def managerList(h):
    user = request.cookies.get('Username')

    main = ddbb.query("SELECT acls.mac, acls.name, (SELECT user.username FROM share, user WHERE share.user=user.id AND share.mac=acls.mac) FROM acls WHERE acls.user=(SELECT id FROM user WHERE username=%s)", user)

    secondary = ddbb.query(
        "SELECT acls.mac, acls.name, user.username FROM acls, share, user WHERE share.mac=acls.mac AND user.id=share.owner AND share.user=(SELECT id FROM user WHERE username=%s)", user)

    response = {'own': [], 'share': []}
    for r in main:
        response['own'].append(
            {'mac': r[0], 'name': r[1], 'shareWith': r[2]})
    for r in secondary:
        response['share'].append(
            {'mac': r[0], 'name': r[1], 'shareBy': r[2]})
    return response


@socketio.on('/manager/name')
def managerChangeName(h):
    user = request.cookies.get('Username')
    mac = h.get('mac').upper()
    if not ddbb.inAcls(user, mac):
        return "403 (Forbidden)", 403
    name = h.get('name')
    if not re.match("^[A-Za-z0-9_-]*$", name) or len(name) > 15:
        return "400 (Bad request)", 400
    ddbb.query(
        "UPDATE acls SET name=%s WHERE user=(SELECT id FROM user WHERE username=%s) AND mac=%s", name, user, mac)
    return {'done': True}


@socketio.on('/manager/share')
def managerChangeShare(h):
    user = request.cookies.get('Username')

    mac = h.get('mac')
    if not isinstance(mac, str):
        return "400 (Bad request)", 400
    mac = mac.upper()
    if not ddbb.inAcls(user, mac):
        return "403 (Forbidden)", 403
    receiver = h.get("email")
    if not isinstance(receiver, str):
        return "400 (Bad request)", 400
    receiver = receiver.lower()

    affected = ddbb.query(
        "SELECT username FROM user WHERE id=(SELECT user FROM share WHERE mac=%s)", mac)
    ddbb.query("DELETE FROM share WHERE share.mac=%s", mac)

    if re.match("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$", receiver):
        if receiver == user:
            return {'done': True}
        new = ddbb.query(
            "SELECT id, pw, confirmValid FROM user WHERE username=%s", receiver)
        if len(new) == 0:
            reuse = ddbb.query(
                "SELECT id FROM user WHERE date_add(NOW(), INTERVAL -1 HOUR) > confirmValid AND pw=''")
            confirm = ''.join(
                [random.choice(string.ascii_letters + string.digits) for _ in range(64)])
            if len(reuse) > 0:
                reuse = reuse[0][0]
                ddbb.query(
                    "UPDATE user SET username=%s, confirm=%s, confirmType='password', confirmData=NULL, confirmValid=now() WHERE id=%s", receiver, confirm, reuse)
                new = reuse
            else:
                new = ddbb.insert(
                    "INSERT INTO user (username, pw, confirm, confirmType, confirmData, confirmValid) VALUES (%s, '', %s, 'password', NULL, now())", receiver, confirm)
            registerShare(user, receiver, confirm)
            receiver = new
        else:
            receiver = new[0][0]
            if new[0][1] == "":
                valid = new[0][2] + timedelta(hours=1)
                valid = valid.timestamp()
                if (valid - time.time()) <= 0:
                    confirm = ''.join(
                        [random.choice(string.ascii_letters + string.digits) for _ in range(64)])
                    ddbb.query(
                        "UPDATE user SET confirm=%s, confirmType='password', confirmData=NULL, confirmValid=now() WHERE id=%s", confirm, new[0][0])
                    registerShare(user, 'efren@boyarizo.es', confirm)
        ddbb.query(
            "INSERT INTO share (owner, user, mac) VALUES ((SELECT id FROM user WHERE username=%s), %s, %s)", user, receiver, mac)
    for u in affected:
        mqtls.acls(u[0])
    return {'done': True}


@socketio.on('/manager/add')
def managerAdd(h):
    user = request.cookies.get('Username')
    mac = h.get('mac')
    if not isinstance(mac, str):
        return "400 (Bad request)", 400
    mac = mac.upper()
    name = h.get('name')
    if not re.match("^[A-Za-z0-9_-]*$", name) or len(name) > 15:
        return "400 (Bad request)", 400
    ddbb.query("INSERT INTO acls (mac, user, name) VALUES (%s, (SELECT id FROM user WHERE username=%s), %s)", mac, user, name)
    return {'done': True}


@socketio.on('/manager/remove')
def managerRemove(h):
    user = request.cookies.get('Username')
    mac = h.get('mac')
    if not isinstance(mac, str):
        return "400 (Bad request)", 400
    mac = mac.upper()
    if not ddbb.inAcls(user, mac):
        return "403 (Forbidden)", 403
    affected = ddbb.query(
        "SELECT username FROM user WHERE id=(SELECT user FROM share WHERE mac=%s) OR id=(SELECT user FROM acls WHERE mac=%s)", mac, mac)
    ddbb.query(
        "DELETE FROM share WHERE user=(SELECT id FROM user WHERE username=%s) AND mac=%s", user, mac)
    ddbb.query(
        "DELETE FROM share WHERE owner=(SELECT id FROM user WHERE username=%s) AND mac=%s", user, mac)
    ddbb.query(
        "DELETE FROM acls WHERE user=(SELECT id FROM user WHERE username=%s) AND mac=%s", user, mac)
    for u in affected:
        mqtls.acls(u[0])
    return {'done': True}
