from modules import modules
from libs import ddbb, sessions
from flask import Flask, request
import base64, json, string

@modules.hub.route('/control/list')
def controlList():
    if sessions.check(request.cookies):
        try:
            user = request.cookies.get('Username')
            main = ddbb.query("SELECT acls.mac, acls.name FROM acls, user WHERE acls.user=user.id AND user.username=%s ORDER BY name", user)
            secondary = ddbb.query("SELECT acls.mac, acls.name FROM acls, share, user WHERE share.user=user.id AND share.mac=acls.mac AND user.username=%s", user)
            response = {'own': [], 'share': []}
            if main != None:
                for i in range(len(main)):
                    response['own'].append({'mac': main[i][0], 'name': main[i][1]})
            if secondary != None:
                for i in range(len(secondary)):
                    response['share'].append({'mac': secondary[i][0], 'name': secondary[i][1]})
            return str(json.dumps(response))
        except Exception as e:
            pass
    return "401 (Unauthorized)", 401



@modules.hub.route('/control/update')
def controlUpdate():
    if sessions.check(request.cookies):
        try:
            user = request.cookies.get('Username')
            main = ddbb.query("(SELECT mac FROM acls WHERE user=(SELECT id FROM user WHERE username=%s)) UNION (SELECT acls.mac FROM acls, share WHERE share.user=(SELECT id FROM user WHERE username=%s) AND share.mac=acls.mac)", user, user)
            response = {}
            for i in range(len(main)):
                response[main[i][0]] = {'Status': ddbb.status.get(main[i][0]), 'Action': ddbb.actions.get(main[i][0])}
            return str(json.dumps(response))
        except Exception as e:
            print(e)
            pass
    return "401 (Unauthorized)", 401


@modules.hub.route('/control/action')
def controlAction():
    if sessions.check(request.cookies):
        try:
            user = request.cookies.get('Username')
            mac = request.headers.get('mac')
            payload = request.headers.get('payload')
            if ddbb.inAcls(user, mac) and len(payload) == 1:
                ddbb.actions.set(mac, payload)
                return str(json.dumps({'Done': '1'}))
        except Exception as e:
            print(e)
            pass
    return "401 (Unauthorized)", 401