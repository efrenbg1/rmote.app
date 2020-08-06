from libs import ddbb, password
from libs.flask import app
from flask import request
import string
import random
from datetime import timedelta
from libs import email
import time
import base64


@app.route('/recover/add')
def recoverAdd():
    user = request.headers.get('Username')
    if user is None:
        return "400 (Bad request)", 400
    user = base64.b64decode(user).decode('utf-8')
    q = ddbb.query(
        "SELECT confirm, confirmType, confirmValid FROM user WHERE username=%s", user)
    if len(q) == 0:
        return "404 (Not Found)", 404
    if q[0][2] != None:
        valid = q[0][2] + timedelta(hours=1)
        valid = valid.timestamp()
        if q[0][1] == 'password' and (valid - time.time()) > 0:
            return "done"
    confirm = ''.join(
        [random.choice(string.ascii_letters + string.digits) for _ in range(64)])
    ddbb.query(
        "UPDATE user SET confirm=%s, confirmType='password', confirmData=NULL, confirmValid=now() WHERE username=%s", confirm, user)
    email.passwordRecovery(user, "/recover.html?confirm={}&email={}".format(
        confirm, base64.b64encode(user.encode('utf-8')).decode('utf-8')))
    return "done"


@app.route('/recover/change')
def recoverChange():
    user = request.headers.get('Username')
    confirm = request.headers.get('Confirm')
    pw = request.headers.get('Password')

    if user is None or confirm is None or len(confirm) != 64:
        return "400 (Bad request)", 400
    if pw is None:
        return "400 (Bad request)", 400

    user = base64.b64decode(user).decode('utf-8')
    pw = base64.b64decode(pw).decode('utf-8')

    if len(pw) < 8 or len(pw) > 20:
        return "400 (Bad request)", 400

    q = ddbb.query(
        "SELECT confirmType, confirmValid FROM user WHERE confirm=%s AND username=%s", confirm, user)
    if len(q) == 0 or q[0][0] != 'password':
        return "404 (Not Found)", 404
    valid = q[0][1] + timedelta(hours=1)
    valid = valid.timestamp()
    if (valid - time.time()) < 0:
        return "410 (Gone)", 410

    ddbb.query("UPDATE user SET confirm=NULL, confirmType=NULL, confirmData=NULL, confirmValid=NULL, pw=%s WHERE username=%s",
               password.createHash(pw), user)
    return "done"
