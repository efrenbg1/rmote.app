import pymysql as mysql
from DBUtils.PersistentDB import PersistentDB
from flask import Flask, g, request
import redis
import warnings
from libs import ddbb, password

host = "127.0.0.1"
warnings.filterwarnings('ignore', category=mysql.Warning)
sessions = redis.Redis(host=host, port=6379, db=0, decode_responses=True)
users = redis.Redis(host=host, port=6379, db=1, decode_responses=True)
acls = redis.Redis(host=host, port=6379, db=2, decode_responses=True)
topics = redis.Redis(host=host, port=6379, db=3, decode_responses=True)


def connect_db():
    return PersistentDB(creator=mysql, user='web', password='SuperPowers4All', host=host, database='rmote')


app = Flask(__name__)


def checkPW(user, pw):
    hash = ddbb.query("SELECT pw FROM user WHERE username=%s LIMIT 1", user)[0]
    if password.checkHash(hash[0], pw):
        return True
    return False


def inAcls(user, mac):
    macs = acls.smembers(user)
    if mac not in macs:
        list = query("(SELECT mac FROM acls WHERE user=(SELECT id FROM user WHERE username=%s)) UNION (SELECT acls.mac FROM acls, share WHERE share.user=(SELECT id FROM user WHERE username=%s) AND share.mac=acls.mac)", user, user)
        if list is not None:
            acls.delete(user)
            for i in range(len(list)):
                acls.sadd(user, list[i][0])
            if mac in acls.smembers(user):
                return True
    else:
        return True
    return False

# Function to get the database


def get_db():
    if not hasattr(app, 'db'):
        app.db = connect_db()
    return app.db.connection()


def query(sql, *param):
    try:
        cursor = get_db().cursor()
        cursor.execute(sql, param)
        result = cursor.fetchall()
        get_db().commit()
        if result is not None:
            return result
    except Exception as e:
        print(e)
        pass
    return None


def querymany(sql, *param):
    try:
        cursor = get_db().cursor()
        cursor.executemany(sql, param)
        result = cursor.fetchall()
        get_db().commit()
        if result is not None:
            return result
    except Exception as e:
        print(e)
        pass
    return None


def insert(sql, *param):
    try:
        cursor = get_db().cursor()
        cursor.execute(sql, param)
        id = cursor.lastrowid
        get_db().commit()
        return id
    except Exception as e:
        print(e)
        pass
    get_db().commit()
    return None
