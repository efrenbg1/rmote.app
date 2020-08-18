from mailer import Mailer
from mailer import Message
from libs.ddbb import email
from jinja2 import Template


def passwordRecovery(to, path):
    with open("emails/password.min.htm") as f:
        html = Template(f.read())
    msg = Message(From="rmote.app", To=to)
    msg.Subject = "rmote.app | Reset password"
    link = email.url + path
    msg.Html = html.render(link=link)
    sender = Mailer(email.host, port=email.port,
                    usr=email.user, pwd=email.pw, use_tls=True)
    sender.send(msg)


def registerConfirm(to, path):
    with open("emails/register.min.htm") as f:
        html = Template(f.read())
    msg = Message(From="rmote.app", To=to)
    msg.Subject = "rmote.app | Verify email"
    link = email.url + path
    msg.Html = html.render(link=link)
    sender = Mailer(email.host, port=email.port,
                    usr=email.user, pwd=email.pw, use_tls=True)
    sender.send(msg)


def registerShare(user, to, path):
    with open("emails/share.min.htm") as f:
        html = Template(f.read())
    msg = Message(From="rmote.app", To=to)
    msg.Subject = "rmote.app | Complete registration"
    link = email.url + path
    msg.Html = html.render(user=user, link=link)
    sender = Mailer(email.host, port=email.port,
                    usr=email.user, pwd=email.pw, use_tls=True)
    sender.send(msg)