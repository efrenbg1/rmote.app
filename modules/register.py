from libs import ddbb, password
from libs.flask import app
from flask import request
import string
import random
from datetime import timedelta
from libs import email
import time
import base64
import re


@app.route('/register')
def register():
    user = request.headers.get('Username')
    pw = request.headers.get('Password')
    mac = request.headers.get('MAC')

    if user is None or mac is None or pw is None:
        return "400 (Bad request)", 400

    user = base64.b64decode(user).decode('utf-8').lower()
    pw = base64.b64decode(pw).decode('utf-8')
    mac = base64.b64decode(mac).decode('utf-8').upper()

    if len(pw) < 8 or len(pw) > 20:
        return "400 (Bad request)", 400

    if not re.match("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$", user):
        return "400 (Bad request)", 400

    q = ddbb.query(
        "SELECT b.mac, a.mac FROM boards AS b LEFT JOIN acls AS a ON b.mac=a.mac WHERE b.mac=%s", mac)
    if len(q) == 0 or q[0][1] != None:
        return "404 (Not Found)", 404

    q = ddbb.query(
        "SELECT pw FROM user WHERE username=%s", user)
    if len(q) > 0 and len(q[0][0]) > 0:
        return "404 (Not Found)", 404

    q = ddbb.query(
        "SELECT confirm, confirmType, confirmValid, confirmData FROM user WHERE username=%s", user)
    if len(q) > 0 and q[0][2] != None:
        valid = q[0][2] + timedelta(hours=1)
        valid = valid.timestamp()
        if q[0][1] == 'register' and (valid - time.time()) > 0:
            return "done"

    q2 = ddbb.query(
        "SELECT id FROM user WHERE date_add(NOW(), INTERVAL -1 HOUR) > confirmValid AND pw=''")

    confirm = ''.join(
        [random.choice(string.ascii_letters + string.digits) for _ in range(64)])
    data = password.createHash(pw) + ";" + mac

    if len(q) > 0:
        ddbb.query(
            "UPDATE user SET confirm=%s, confirmType='register', confirmData=%s, confirmValid=now() WHERE username=%s", confirm, data, user)
    elif len(q2) > 0:
        ddbb.query(
            "UPDATE user SET username=%s, confirm=%s, confirmType='register', confirmData=%s, confirmValid=now() WHERE id=%s", user, confirm, data, q2[0][0])
    else:
        ddbb.query(
            "INSERT INTO user (username, pw, confirm, confirmType, confirmData, confirmValid) VALUES (%s, '', %s, 'register', %s, now())", user, confirm, data)
    email.registerConfirm("efren@boyarizo.es", "/register.html?confirm={}&email={}".format(
        confirm, base64.b64encode(user.encode('utf-8')).decode('utf-8')))
    return "done"


@app.route('/register/confirm')
def registerConfirm():
    user = request.headers.get('Username')
    confirm = request.headers.get('Confirm')

    if user is None or confirm is None:
        return "400 (Bad request)", 400

    user = base64.b64decode(user).decode('utf-8')

    q = ddbb.query(
        "SELECT confirmType, confirmData, confirmValid FROM user WHERE confirm=%s AND username=%s", confirm, user)
    if len(q) == 0 or q[0][0] != 'register':
        return "404 (Not Found)", 404
    valid = q[0][2] + timedelta(hours=1)
    valid = valid.timestamp()
    if (valid - time.time()) < 0:
        return "410 (Gone)", 410

    data = q[0][1].split(';')

    ddbb.query(
        "INSERT INTO acls (mac, user, name) SELECT %s, id, 'Unnamed' FROM user WHERE username=%s", data[1], user)
    ddbb.query(
        "UPDATE user SET pw=%s, confirm=NULL, confirmType=NULL, confirmData=NULL, confirmValid=NULL WHERE username=%s", data[0], user)
    return "done"
