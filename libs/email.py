from mailer import Mailer
from mailer import Message
from libs.ddbb import email
from libs import ddbb


def passwordRecovery():

    with open("emails/password.min.htm") as f:
        html = f.read()
    msg = Message(From="rmote.app", To=to)
    msg.Subject = "rmote.app | Reset password"
    msg.Html = html
    sender = Mailer(email.host, port=email.port,
                    usr=email.user, pwd=email.pw, use_tls=True)
    sender.send(msg)
