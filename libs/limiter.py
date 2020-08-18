from flask import request
import time
import threading
from libs import ddbb
from hashlib import md5
import json

limiter = {}
llimiter = threading.Lock()


def get_ip():
    proxy = request.headers.get('X-Real-Ip')
    real = request.remote_addr
    if proxy != None and real == ddbb.settings.proxy:
        return proxy
    return real


def count(login=False):
    ip = get_ip()
    if login:
        headers = json.dumps({k: v for k, v in request.headers.items()})
        hash = md5(json.dumps(headers).encode()).hexdigest()
    else:
        cookies = json.dumps({k: v for k, v in request.headers.items()})
        hash = md5(json.dumps(cookies).encode()).hexdigest()
    with llimiter:
        limit = limiter.get(ip)
        if limit == None or (time.time() - limit[1]) >= 0:
            limiter[ip] = [[hash], time.time() + 30]
            return
        if hash in limit[0]:
            return
        limit[0].append(hash)
        limit[1] = time.time() + 30
        limiter[ip] = limit


def check():
    ip = get_ip()
    with llimiter:
        limit = limiter.get(ip)
        if limit != None and len(limit[0]) > 4 and (time.time() - limit[1]) < 0:
            limit[1] = time.time() + 30
            limiter[ip] = limit
            return False
    return True
