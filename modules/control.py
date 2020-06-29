from modules import modules
from libs import ddbb, sessions
from flask import Flask, request
import base64
import json
import string


@modules.hub.route('/control/list')
def controlList():
    if sessions.check(request.cookies):
        try:
            user = request.cookies.get('Username')
            main = ddbb.query(
                "SELECT acls.mac, acls.name, acls.cluster FROM acls, user WHERE acls.user=user.id AND user.username=%s ORDER BY name", user)
            secondary = ddbb.query(
                "SELECT acls.mac, acls.name FROM acls, share, user WHERE share.user=user.id AND share.mac=acls.mac AND user.username=%s", user)
            response = {'own': [], 'share': []}
            if main != None:
                for i in range(len(main)):
                    status = ddbb.retrieve(main[i][0], 0)
                    action = ddbb.retrieve(main[i][0], 1)
                    version = ddbb.retrieve(main[i][0], 2)
                    response['own'].append({'mac': main[i][0], 'name': main[i][1], 'cluster': main[i]
                                            [2], 'status': status, 'action': action, 'version': version})
            if secondary != None:
                for i in range(len(secondary)):
                    status = ddbb.retrieve(secondary[i][0], 0)
                    action = ddbb.retrieve(secondary[i][0], 1)
                    version = ddbb.retrieve(secondary[i][0], 2)
                    response['share'].append(
                        {'mac': secondary[i][0], 'name': secondary[i][1], 'status': status, 'action': action, 'version': version})
            if len(response['own']) == 0 and len(response['share']) == 0:
                ddbb.query("DELETE FROM user WHERE username=%s", user)
                return "401 (Unauthorized)", 401
            return str(json.dumps(response))
        except Exception as e:
            print(e)
            return "400 (Bad request)", 400
    return "401 (Unauthorized)", 401


@modules.hub.route('/control/update')
def controlUpdate():
    if sessions.check(request.cookies):
        try:
            user = request.cookies.get('Username')
            main = ddbb.query("(SELECT mac FROM acls WHERE user=(SELECT id FROM user WHERE username=%s)) UNION (SELECT acls.mac FROM acls, share WHERE share.user=(SELECT id FROM user WHERE username=%s) AND share.mac=acls.mac)", user, user)
            response = []
            for i in range(len(main)):
                status = ddbb.retrieve(main[i][0], 0)
                action = ddbb.retrieve(main[i][0], 1)
                response.append(
                    {'mac': main[i][0], 'status': status, 'action': action})
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
                ddbb.publish(mac, 1, payload)
                return str(json.dumps({'Done': '1'}))
        except Exception as e:
            print(e)
            pass
    return "401 (Unauthorized)", 401
