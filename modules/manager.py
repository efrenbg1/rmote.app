from libs import ddbb
from flask import request
from libs.flask import socketio
import re


@socketio.on('/manager/list')
def managerList(h):
    user = request.cookies.get('Username')

    main = ddbb.query("SELECT acls.mac, acls.name, GROUP_CONCAT(IF(share.owner=(SELECT id FROM user WHERE username=%s) AND share.mac=acls.mac AND share.user=user.id, user.username, '') SEPARATOR '') AS shareWith FROM acls, share, user WHERE acls.user=(SELECT id FROM user WHERE username=%s) GROUP BY acls.mac", user, user)

    secondary = ddbb.query("SELECT acls.mac, acls.name, GROUP_CONCAT(IF(share.user=(SELECT id FROM user WHERE username=%s) AND user.id=share.owner, user.username, '') SEPARATOR '') as shareBy FROM acls, share, user WHERE share.user=(SELECT id FROM user WHERE username=%s) AND share.mac=acls.mac", user, user)

    response = {'own': [], 'share': []}
    for r in main:
        response['own'].append(
            {'mac': r[0], 'name': r[1], 'shareWith': r[2]})
    for r in secondary:
        response['share'].append(
            {'mac': r[0], 'name': r[1], 'shareBy': r[2]})
    return response


@socketio.on('/manager/name')
def managerChangeName(h):
    user = request.cookies.get('Username')
    mac = h.get('mac').upper()
    if not ddbb.inAcls(user, mac):
        return "403 (Forbidden)", 403
    name = h.get('name')
    if not re.match("^[A-Za-z0-9_-]*$", name) or len(name) > 15:
        return "400 (Bad request)", 400
    ddbb.query(
        "UPDATE acls SET name=%s WHERE user=(SELECT id FROM user WHERE username=%s) AND mac=%s", name, user, mac)
    return {'done': True}


@socketio.on('/manager/share')
def managerChangeShare(h):
    # TODO arreglar lo de compartir placas
    user = request.cookies.get('Username')
    mac = h.get('mac').upper()
    if not ddbb.inAcls(user, mac):
        return "403 (Forbidden)", 403
    email = h.get("email")
    if re.match("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$", email):
        return shareHandler(user, mac, email)
    else:
        q = ddbb.query(
            "DELETE FROM share WHERE share.mac=%s AND (share.owner=(SELECT id FROM user WHERE username=%s) OR share.user=(SELECT id FROM user WHERE username=%s))", mac, user, user)
        ddbb.query("DELETE IGNORE FROM user WHERE pw=''")
        if q != None:
            return {'done': True}


@socketio.on('/manager/add')
def managerAdd(h):
    user = request.cookies.get('Username')
    mac = h.get('mac').upper()
    if not ddbb.inAcls(user, mac):
        return "403 (Forbidden)", 403
    name = h.get('name')
    if not re.match("^[A-Za-z0-9_-]*$", name) or len(name) > 15:
        return "400 (Bad request)", 400
    ddbb.query("INSERT INTO acls (mac, user, name) VALUES (%s, (SELECT id FROM user WHERE username=%s), %s)", mac, user, name)
    # TODO poner actualizar acls del broker (aunque para añadir no debería ser necesario)
    return {'done': True}


@socketio.on('/manager/remove')
def managerRemove(h):
    user = request.cookies.get('Username')
    mac = h.get('mac').upper()
    if not ddbb.inAcls(user, mac):
        return "403 (Forbidden)", 403
    ddbb.query(
        "DELETE FROM share WHERE owner=(SELECT id FROM user WHERE username=%s) AND mac=%s", user, mac)
    ddbb.query(
        "DELETE FROM acls WHERE user=(SELECT id FROM user WHERE username=%s) AND mac=%s", user, mac)
    # TODO actualizar acls del broker
    return {'done': True}


def shareHandler(owner, mac, email):
    # TODO esto hay que simplificarlo
    new = ddbb.query("SELECT id, pw FROM user WHERE username=%s", email)
    if len(new) == 0:
        insert = ddbb.insert(
            "INSERT INTO user(username, pw) VALUES (%s, '')", email)
    else:
        insert = new[0][0]
    q = ddbb.insert(
        "INSERT INTO share(owner, user, mac) VALUES ((SELECT id FROM user WHERE username=%s), %s, %s)", owner, insert, mac)
    if q == None:  # board already exists
        if insert == None:
            q = ddbb.insert(
                "UPDATE share SET user=(SELECT id FROM user WHERE username=%s) WHERE mac=%s AND owner=(SELECT id FROM user WHERE username=%s)", email, mac, owner)
        else:
            q = ddbb.insert(
                "UPDATE share SET user=%s WHERE mac=%s AND owner=(SELECT id FROM user WHERE username=%s)", insert, mac, owner)
        if q != None:
            ddbb.query("DELETE IGNORE FROM user WHERE pw=''")
    return {'Done': '1'}
