from libs import ddbb, password
from flask import request
from libs.flask import app
import base64
import json
import string
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
        "SELECT pw FROM user WHERE username=%s", user)
    if len(q) > 0:
        if len(q[0][0]) == 0:
            return "208 (Already Reported)", 208
        else:
            return "400 (Bad request)", 400

    q = ddbb.query(
        "SELECT b.mac, a.mac FROM boards AS b LEFT JOIN acls AS a ON b.mac=a.mac WHERE b.mac=%s", mac)
    if len(q) == 0:
        return "404 (Not Found)", 404
    if q[0][1] != None:
        return "208 (Already Reported)", 208

    valid = q[0][1] + timedelta(hours=1)
    valid = valid.timestamp()
    if (valid - time.time()) < 0:
        return "410 (Gone)", 410

    ddbb.query("UPDATE user SET confirm=NULL, confirmType=NULL, confirmData=NULL, confirmValid=NULL, pw=%s WHERE username=%s",
               password.createHash(pw), user)
    return "done"
