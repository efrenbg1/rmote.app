from modules import modules
from libs import ddbb, sessions
from flask import Flask, request
import base64, json, string, re

@modules.hub.route('/manager/list')
def managerList():
    if sessions.check(request.cookies):
        try:
            user = request.cookies.get('Username')
            main = ddbb.query("SELECT acls.mac, acls.name, acls.autoON, acls.autoOFF, GROUP_CONCAT(IF(share.owner=(SELECT id FROM user WHERE username=%s) AND share.mac=acls.mac AND share.user=user.id, user.username, '') SEPARATOR '') AS shareWith FROM acls, share, user WHERE acls.user=(SELECT id FROM user WHERE username=%s) GROUP BY acls.mac", user, user)
            secondary = ddbb.query("SELECT acls.mac, acls.name, GROUP_CONCAT(IF(share.user=(SELECT id FROM user WHERE username=%s) AND user.id=share.owner, user.username, '') SEPARATOR '') as shareBy FROM acls, share, user WHERE share.user=(SELECT id FROM user WHERE username=%s) AND share.mac=acls.mac", user, user)
            response = {'own': [], 'share': []}
            if main != None:
                for i in range(len(main)):
                    response['own'].append({'mac': main[i][0], 'name': main[i][1], 'autoON': main[i][2], 'autoOFF': main[i][3], 'shareWith': main[i][4]})
            if secondary != None:
                for i in range(len(secondary)):
                    response['share'].append({'mac': secondary[i][0], 'name': secondary[i][1], 'shareBy': secondary[i][2]})
            print(response)
            return str(json.dumps(response))
        except Exception as e:
            pass
    return "401 (Unauthorized)", 401


@modules.hub.route('/manager/change')
def managerList():
    if sessions.check(request.cookies):
        try:
            user = request.cookies.get('Username')
            mac = request.headers.get('mac')
            type = request.headers.get('type')
            if type == "0":
                autoON = int(request.headers.get('autoON'))
                autoOFF = int(request.headers.get('autoOFF'))
                name = request.headers.get('name')
                if re.match("^[A-Za-z0-9_-]*$", name) and len(name) < 16:
                    if not -1 < autoON < 1440:
                        autoON = None
                    if not -1 < autoOFF < 1440:
                        autoOFF = None
                    q = ddbb.query("UPDATE acls SET name=%s, autoON=%s, autoOFF=%s WHERE user=(SELECT id FROM user WHERE username=%s) AND mac=%s", name, autoON, autoOFF, user, mac)
                    if q != None:
                        return str(json.dumps({'Done': '1'}))
            else if type == "1":

            else if type == "8":

            else if type == "9":
            main = ddbb.query("SELECT acls.mac, acls.name, acls.autoON, acls.autoOFF, GROUP_CONCAT(IF(share.owner=(SELECT id FROM user WHERE username=%s) AND share.mac=acls.mac AND share.user=user.id, user.username, '') SEPARATOR '') AS shareWith FROM acls, share, user WHERE acls.user=(SELECT id FROM user WHERE username=%s) GROUP BY acls.mac", user, user)
            secondary = ddbb.query("SELECT acls.mac, acls.name, GROUP_CONCAT(IF(share.user=(SELECT id FROM user WHERE username=%s) AND user.id=share.owner, user.username, '') SEPARATOR '') as shareBy FROM acls, share, user WHERE share.user=(SELECT id FROM user WHERE username=%s) AND share.mac=acls.mac", user, user)
            response = {'own': [], 'share': []}
            if main != None:
                for i in range(len(main)):
                    response['own'].append({'mac': main[i][0], 'name': main[i][1], 'autoON': main[i][2], 'autoOFF': main[i][3], 'shareWith': main[i][4]})
            if secondary != None:
                for i in range(len(secondary)):
                    response['share'].append({'mac': secondary[i][0], 'name': secondary[i][1], 'shareBy': secondary[i][2]})
            print(response)
            return str(json.dumps(response))
        except Exception as e:
            pass
    return "401 (Unauthorized)", 401
