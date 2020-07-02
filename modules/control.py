from libs import ddbb
from libs.flask import socketio
from flask import request
import time


@socketio.on('/control/list')
def controlList(h):
    user = request.cookies.get('Username')
    main = ddbb.query(
        "SELECT acls.mac, acls.name FROM acls, user WHERE acls.user=user.id AND user.username=%s ORDER BY name", user)
    secondary = ddbb.query(
        "SELECT acls.mac, acls.name FROM acls, share, user WHERE share.user=user.id AND share.mac=acls.mac AND user.username=%s", user)
    response = {'own': [], 'share': []}
    for r in main:
        status = ddbb.retrieve(r[0], 0)
        action = ddbb.retrieve(r[0], 1)
        version = ddbb.retrieve(r[0], 2)
        response['own'].append({'mac': r[0], 'name': r[1],
                                'status': status, 'action': action, 'version': version})
    for r in secondary:
        status = ddbb.retrieve(r[0], 0)
        action = ddbb.retrieve(r[0], 1)
        version = ddbb.retrieve(r[0], 2)
        response['share'].append(
            {'mac': r[0], 'name': r[1], 'status': status, 'action': action, 'version': version})
    return response


@socketio.on('/control/update')
def controlUpdate(h):
    user = request.cookies.get('Username')
    main = ddbb.query("(SELECT mac FROM acls WHERE user=(SELECT id FROM user WHERE username=%s)) UNION (SELECT acls.mac FROM acls, share WHERE share.user=(SELECT id FROM user WHERE username=%s) AND share.mac=acls.mac)", user, user)
    response = []
    for r in main:
        status = ddbb.retrieve(r[0], 0)
        action = ddbb.retrieve(r[0], 1)
        response.append(
            {'mac': r[0], 'status': status, 'action': action})
    return response


@socketio.on('/control/action')
def controlAction(h):
    user = request.cookies.get('Username')
    mac = h.get('mac')
    payload = h.get('payload')
    if ddbb.inAcls(user, mac) and len(payload) == 1:
        ddbb.publish(mac, 1, payload)
        return {'done': True}
    return "403 (Forbidden)", 403
