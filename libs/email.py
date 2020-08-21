from mailer import Message, Mailer
from libs.ddbb import email
from jinja2 import Template
import queue
import threading
import base64

q = queue.Queue()


def sender():
    sender = Mailer(email.host, port=email.port,
                    usr=email.user, pwd=email.pw, use_tls=True)
    while True:
        d = q.get()
        print(d)
        with open("emails/" + d['template']) as f:
            html = Template(f.read())
        msg = Message(From="rmote.app", To=d['to'])
        msg.Subject = d['subject']
        msg.Html = html.render(d['render'])
        sender.send(msg)
        q.task_done()


threading.Thread(target=sender, daemon=True).start()


def passwordRecovery(to, confirm):
    to_url = base64.b64encode(to.encode('utf-8')).decode('utf-8')
    q.put({
        'template': 'password.min.htm',
        'to': to,
        'subject': "rmote.app | Reset password",
        'render': {
            'link': email.url + "/recover.html?confirm={}&email={}".format(confirm, to_url)
        }
    })


def registerConfirm(to, confirm):
    to_url = base64.b64encode(to.encode('utf-8')).decode('utf-8')
    q.put({
        'template': 'register.min.htm',
        'to': to,
        'subject': "rmote.app | Verify email",
        'render': {
            'link': email.url + "/register.html?confirm={}&email={}".format(confirm, to_url)
        }
    })


def emailConfirm(to, old, confirm):
    old = base64.b64encode(old.encode('utf-8')).decode('utf-8')
    q.put({
        'template': 'email.min.htm',
        'to': to,
        'subject': "rmote.app | Confirm email",
        'render': {
            'link': email.url + "/register.html?confirm={}&email={}".format(confirm, old)
        }
    })


def registerShare(user, to, confirm):
    to_url = base64.b64encode(to.encode('utf-8')).decode('utf-8')
    q.put({
        'template': 'share.min.htm',
        'to': to,
        'subject': "rmote.app | Complete registration",
        'render': {
            'user': user,
            'link': email.url + "/recover.html?confirm={}&email={}".format(confirm, to_url)
        }
    })
