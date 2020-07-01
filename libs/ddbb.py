import pymysql as mysql
from DBUtils.PooledDB import PooledDB
from flask import request
from libs import ddbb, password
from libs.flask import app
import socket
import ssl
import threading
import json
from pathlib import Path
import shelve
import select


class SettingsDB:
    def __init__(self, host, user, pw, db, broker):
        self.host = host
        self.user = user
        self.pw = pw
        self.db = db
        self.broker = broker


settings = SettingsDB("127.0.0.1", "root", "", "rmote", "127.0.0.1")

with open('settings.json', "r") as f:
    param = json.load(f)
    settings.host = param['host']
    settings.user = param['user']
    settings.pw = param['pw']
    settings.db = param['db']
    settings.broker = param['broker']

s = None
broker = None
lbroker = threading.Lock()

Path("db").mkdir(parents=True, exist_ok=True)
sessions = shelve.open('db/sessions', writeback=True)
lsessions = threading.Lock()


def len2(string):
    return str(len(string)).zfill(2)


def publish(topic, slot, message):
    global broker, lbroker, s
    try:
        with lbroker:
            broker.send(str.encode(
                "MQS6" + len2(topic) + topic + str(slot) + len2(message) + message + '\n'))
    except Exception:
        with lbroker:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(10)
            broker = ssl.wrap_socket(s)
            broker.connect((settings.broker, 2443))
            broker.send(str.encode(
                "MQS6" + len2(topic) + topic + str(slot) + len2(message) + message + '\n'))


def retrieve(topic, slot):
    global broker, lbroker, s
    rx = "MQS7\n"
    try:
        with lbroker:
            broker.send(str.encode(
                "MQS7" + len2(topic) + topic + str(slot) + '\n'))
            ready = select.select([broker], [], [], 1)
            if ready[0]:
                rx = broker.recv(210)
    except Exception:
        with lbroker:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(10)
            broker = ssl.wrap_socket(s)
            broker.connect((settings.broker, 2443))
            broker.send(str.encode(
                "MQS7" + len2(topic) + topic + str(slot) + '\n'))
            ready = select.select([broker], [], [], 1)
            if ready[0]:
                rx = broker.recv(210)
    finally:
        if isinstance(rx, str):
            raise Exception(
                "Timed out while waiting for response! Is broker up?")
        rx = rx.decode("utf-8")
        if len(rx) < 4:
            return None
        if rx[:4] == "MQS7":
            return None
        if rx[:4] == "MQS2":
            return rx[6:6+int(rx[4:6])]


def checkPW(user, pw):
    hash = ddbb.query("SELECT pw FROM user WHERE username=%s LIMIT 1", user)
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
