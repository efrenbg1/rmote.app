from modules import modules
from libs import ddbb, sessions
from flask import Flask, request
import base64, json, string, re

@modules.hub.route('/manager/list')
def managerList():
    if sessions.check(request.cookies):
        try:
            user = request.cookies.get('Username')
            main = ddbb.query("SELECT acls.mac, acls.name, acls.cluster, GROUP_CONCAT(IF(share.owner=(SELECT id FROM user WHERE username=%s) AND share.mac=acls.mac AND share.user=user.id, user.username, '') SEPARATOR '') AS shareWith FROM acls, share, user WHERE acls.user=(SELECT id FROM user WHERE username=%s) GROUP BY acls.mac", user, user)
            secondary = ddbb.query("SELECT acls.mac, acls.name, GROUP_CONCAT(IF(share.user=(SELECT id FROM user WHERE username=%s) AND user.id=share.owner, user.username, '') SEPARATOR '') as shareBy FROM acls, share, user WHERE share.user=(SELECT id FROM user WHERE username=%s) AND share.mac=acls.mac", user, user)
            response = {'own': [], 'share': []}
            if main != None:
                for i in range(len(main)):
                    response['own'].append({'mac': main[i][0], 'name': main[i][1], 'cluster': main[i][2], 'shareWith': main[i][3]})
            if secondary != None:
                for i in range(len(secondary)):
                    if secondary[i][0] != None:
                        response['share'].append({'mac': secondary[i][0], 'name': secondary[i][1], 'shareBy': secondary[i][2]})
            if len(response['own']) == 0 and len(response['share']) == 0:
                ddbb.query("DELETE FROM user WHERE username=%s", user)
                return "401 (Unauthorized)", 401
            return str(json.dumps(response))
        except Exception as e:
            pass
    return "401 (Unauthorized)", 401


@modules.hub.route('/manager/change')
def managerChange():
    if sessions.check(request.cookies):
            user = request.cookies.get('Username')
            mac = request.headers.get('mac')
            type = request.headers.get('type')
            if type == "0": #change name or cluster
                if not ddbb.inAcls(user, mac):
                    return "403 (Forbidden)", 403
                name = request.headers.get('name')
                cluster = 0 #request.headers.get('cluster')
                if re.match("^[A-Za-z0-9_-]*$", name) and len(name) < 16:
                    q = ddbb.query("UPDATE acls SET name=%s, cluster=%s WHERE user=(SELECT id FROM user WHERE username=%s) AND mac=%s", name, cluster, user, mac)
                    if q != None:
                        return str(json.dumps({'Done': '1'}))
            elif type == "1": #share board or remove share
                if not ddbb.inAcls(user, mac):
                    return "403 (Forbidden)", 403
                email = base64.b64decode(request.headers.get("email")).decode('utf-8')
                if re.match("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$", email):
                    return shareHandler(user, mac, email)
                else:
                    print("here")
                    q = ddbb.query("DELETE FROM share WHERE share.mac=%s AND (share.owner=(SELECT id FROM user WHERE username=%s) OR share.user=(SELECT id FROM user WHERE username=%s))", mac, user, user)
                    ddbb.query("DELETE IGNORE FROM user WHERE pw=''")
                    if q != None:
                        return str(json.dumps({'Done': '1'}))
            elif type == "8": #add board
                name = request.headers.get('name')
                if re.match("^[A-Za-z0-9_-]*$", name) and len(name) < 16:
                    q = ddbb.query("INSERT INTO acls (mac, user, name) VALUES (%s, (SELECT id FROM user WHERE username=%s), %s)", mac, user, name)
                    if q != None:
                        ddbb.acls.sadd(user, mac)
                        return str(json.dumps({'Done': '1'}))
            elif type == "9": #remove board
                if not ddbb.inAcls(user, mac):
                    return "403 (Forbidden)", 403
                share = ddbb.query("DELETE FROM share WHERE owner=(SELECT id FROM user WHERE username=%s) AND mac=%s", user, mac)
                if share != None:
                    q = ddbb.query("DELETE FROM acls WHERE user=(SELECT id FROM user WHERE username=%s) AND mac=%s", user, mac)
                    if q != None:
                        ddbb.acls.srem(user, mac)
                    return str(json.dumps({'Done': '1'}))
            return "400 (Bad Request)", 400
    return "401 (Unauthorized)", 401



def shareHandler(owner, mac, email):
    new = ddbb.query("SELECT id, pw FROM user WHERE username=%s", email)
    if len(new)==0:
        insert = ddbb.insert("INSERT INTO user(username, pw) VALUES (%s, '')", email)
    else:
        insert = new[0][0]
    q = ddbb.insert("INSERT INTO share(owner, user, mac) VALUES ((SELECT id FROM user WHERE username=%s), %s, %s)", owner, insert, mac)
    if q == None: #board already exists
        if insert == None:
            q = ddbb.insert("UPDATE share SET user=(SELECT id FROM user WHERE username=%s) WHERE mac=%s AND owner=(SELECT id FROM user WHERE username=%s)", email, mac, owner)
        else:
            q = ddbb.insert("UPDATE share SET user=%s WHERE mac=%s AND owner=(SELECT id FROM user WHERE username=%s)", insert, mac, owner)
        if q != None:
            ddbb.query("DELETE IGNORE FROM user WHERE pw=''")
    return str(json.dumps({'Done': '1'}))