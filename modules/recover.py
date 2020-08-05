from libs import ddbb
from libs.flask import app
from flask import request
import string
import random
from datetime import timedelta
from libs import email
import time


@app.route('/recover/add')
def recoverAdd():
    user = request.headers.get('Username')
    if user is None:
        return "400 (Bad request)", 400
    q = ddbb.query(
        "SELECT confirm, confirmType, confirmValid FROM user WHERE username=%s", user)
    if len(q) == 0:
        return "404 (Not Found)", 404
    valid = q[0][2] + timedelta(hours=1)
    valid = valid.timestamp()
    # if q[0][1] == 'password' and (valid - time.time()) > 0:
    #    return "done"
    confirm = ''.join(
        [random.choice(string.ascii_letters + string.digits) for _ in range(64)])
    ddbb.query(
        "UPDATE user SET confirm=%s, confirmType='password', confirmData=NULL, confirmValid=now() WHERE username=%s", confirm, user)
    email.passwordRecovery(user, "/recover.html?confirm={}".format(confirm))
    return "done"
