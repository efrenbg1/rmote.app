import base64, time, json, string, os, random
from libs import ddbb, password, core
from flask import Flask, request

def start(user):
    hash = base64.urlsafe_b64encode(bytearray(os.urandom(random.randint(40, 60)))).decode('utf-8')
    ddbb.sessions.set(user, hash)
    return hash

#Function to checkl in the database if the credentials are correct so the login is valid or not.
@core.hub.route('/login')
def login():
    try:
        user = request.headers.get('Username')
        pw = request.headers.get('Password')
        if user is not None and pw is not None:
            user = base64.b64decode(user).decode('utf-8')
            pw = base64.b64decode(pw).decode('utf-8')
            if ddbb.checkPW(user, pw):
                response = {"Username": user, "Cookie": start(user), "Permissions": []}
                return str(json.dumps(response))
    except Exception as e:
        pass
    return "401 (Unauthorized)", 401

#Function to delete the sessions of the user to logout
@core.hub.route('/logout')
def logout():
    try:
        user = request.cookies.get('Username')
        hash = request.cookies.get('Session')
        if user is not None and hash is not None:
            if ddbb.sessions.get(user) == hash:
                ddbb.sessions.delete(user)
                return """{'Done':1}"""
    except Exception as e:
        pass
    return "401 (Unauthorized)", 401


def check(cookies):
    try:
        if ddbb.sessions.get(cookies.get('Username')) == cookies.get('Session'):
            return True
    except:
        pass
    return False
