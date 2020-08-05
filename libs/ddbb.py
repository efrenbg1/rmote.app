import pymysql as mysql
from DBUtils.PooledDB import PooledDB
from flask import request
from libs import password
from libs.flask import app
import json


class SettingsDB:
    def __init__(self, host, user, pw, db, broker):
        self.host = host
        self.user = user
        self.pw = pw
        self.db = db
        self.broker = broker


class SettingsEmail:
    def __init__(self, host, port, user, pw, url):
        self.host = host
        self.port = port
        self.user = user
        self.pw = pw
        self.url = url


settings = SettingsDB("127.0.0.1", "root", "", "rmote", "127.0.0.1")
email = SettingsEmail("smtp.gmail.com", 25,
                      "name@domain.com", "password", "http://localhost")

with open('settings.json', "r") as f:
    param = json.load(f)
    settings.host = param['mysql']['host']
    settings.user = param['mysql']['user']
    settings.pw = param['mysql']['pw']
    settings.db = param['mysql']['db']
    settings.broker = param['broker']
    email.host = param['email']['host']
    email.port = param['email']['port']
    email.user = param['email']['user']
    email.pw = param['email']['pw']
    email.url = param['email']['url']


def checkPW(user, pw):
    hash = query("SELECT pw FROM user WHERE username=%s LIMIT 1", user)
    if len(hash) != 1:
        return False
    if password.checkHash(hash[0][0], pw):
        return True
    return False


def inAcls(user, mac):
    acls = query("SELECT a.mac FROM acls AS a LEFT JOIN share AS s ON a.mac=s.mac WHERE a.user=(SELECT id FROM user WHERE username=%s) OR s.user=(SELECT id FROM user WHERE username=%s)", user, user)
    for r in acls:
        if r[0] == mac:
            return True
    return False


def get_db():
    if not hasattr(app, 'db'):
        app.db = PooledDB(creator=mysql, user=settings.user,
                          password=settings.pw, host=settings.host, database=settings.db)
    return app.db.connection()


def query(sql, *param):
    if not hasattr(request, 'conn'):
        request.conn = get_db()
    cursor = request.conn.cursor()
    cursor.execute(sql, param)
    result = cursor.fetchall()
    request.conn.commit()
    if result is None:
        raise Exception("Error fetching query result: is of None type")
    return result


def insert(sql, *param):
    if not hasattr(request, 'conn'):
        request.conn = get_db()
    cursor = request.conn.cursor()
    cursor.execute(sql, param)
    id = cursor.lastrowid
    request.conn.commit()
    if id is None:
        raise Exception("Insert id returned None")
    return id
