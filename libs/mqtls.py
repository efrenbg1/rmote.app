from libs import ddbb
import socket
import ssl
import threading
import select

s = None
broker = None
lbroker = threading.Lock()


def len2(string):
    return str(len(string)).zfill(2)


def reconnect():
    global broker, lbroker, s
    with lbroker:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(10)
        broker = ssl.wrap_socket(s)
        broker.connect((ddbb.settings.broker, 2443))


def send(data):
    global broker, lbroker
    with lbroker:
        broker.send(str.encode(data + '\n'))


def receive():
    global broker, lbroker
    with lbroker:
        buff = b''
        ready = select.select([broker], [], [], 1)
        if ready[0]:
            rx = broker.recv(1)
        else:
            raise Exception(
                "Timed out while waiting for response! Is broker up?")
        while rx != b'\n':
            if rx == b'':
                raise Exception(
                    "Read invalid character!")
            buff += rx
            if len(buff) > 210:
                break
            rx = broker.recv(1)
        return buff


def publish(topic, slot, message):
    global broker, lbroker, s
    try:
        with lbroker:
            broker.send(str.encode(
                "MQS6" + len2(topic) + topic + str(slot) + len2(message) + message + '\n'))
    except Exception:
        reconnect()
        with lbroker:
            broker.send(str.encode(
                "MQS6" + len2(topic) + topic + str(slot) + len2(message) + message + '\n'))


def retrieve(topic, slot):
    global broker, lbroker
    rx = "MQS7\n"
    try:
        send("MQS7" + len2(topic) + topic + str(slot))
        rx = receive()
    except Exception:
        reconnect()
        send("MQS7" + len2(topic) + topic + str(slot))
        rx = receive()
    finally:
        if isinstance(rx, str):
            raise Exception("MqTLS: error in retrieve")
        rx = rx.decode("utf-8")
        if len(rx) < 4:
            return None
        if rx[:4] == "MQS7":
            return None
        if rx[:4] == "MQS2":
            return rx[6:6+int(rx[4:6])]


def user(user):
    global broker, lbroker
    rx = ""
    try:
        send("MQS8" + len2(user) + user)
        rx = receive()
    except Exception:
        reconnect()
        send("MQS8" + len2(user) + user)
        rx = receive()
    finally:
        if isinstance(rx, str):
            raise Exception("MqTLS: error in user update")
        rx = rx.decode("utf-8")
        if len(rx) < 4:
            return False
        if rx[:4] == "MQS8":
            return True
        return False


def acls(user):
    global broker, lbroker
    rx = ""
    try:
        send("MQS9" + len2(user) + user + '\n')
        rx = receive()
    except Exception:
        reconnect()
        send("MQS9" + len2(user) + user + '\n')
        rx = receive()
    finally:
        if isinstance(rx, str):
            raise Exception("MqTLS: error in acls update")
        rx = rx.decode("utf-8")
        if len(rx) < 4:
            return False
        if rx[:4] == "MQS9":
            return True
        return False
