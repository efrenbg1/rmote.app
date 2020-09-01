import socket
import ssl
import threading
import select
import queue


class mqtls:
    def __init__(self, host="127.0.0.1", port=2443, user=None, pw=None):
        self._host = host
        self._port = port
        self._user = user
        self._pw = pw
        self._socket = None
        self._broker = None
        self._queue = queue.Queue()
        self._lock = threading.Lock()
        with self._lock:
            self.__connect()

    def __len2(self, string):
        return str(len(string)).zfill(2)

    def __connect(self):
        self._socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._socket.settimeout(10)
        self._broker = ssl.wrap_socket(self._socket)
        self._broker.connect((self._host, self._port))
        if not self._broker:
            raise Exception("Could not connect to broker!")
        if self._user and self._pw:
            rx = None
            try:
                self.__send("MQS0" + self.__len2(self._user) +
                            self._user + self.__len2(self._pw) + self._pw + "1")
                rx = self.__receive()
            except Exception:
                raise Exception("MqTLS: error in auth")
            if not rx:
                raise Exception("MqTLS: error in auth")
            rx = rx.decode("utf-8")
            if len(rx) < 4:
                raise Exception("MqTLS: error in auth")
            if rx[:4] != "MQS0":
                raise Exception("MqTLS: error in auth")

    def __send(self, data):
        self._broker.send(str.encode(data + '\n'))

    def __receive(self):
        buff = b''
        ready = select.select([self._broker], [], [], 1)
        if ready[0]:
            rx = self._broker.recv(1)
        else:
            raise Exception(
                "Timed out while waiting for response! Is broker up?")
        while rx != b'\n':
            if rx == b'':
                raise Exception("Read invalid character!")
            buff += rx
            if len(buff) > 210:
                break
            rx = self._broker.recv(1)
        return buff

    def publish(self, topic, slot, message):
        if self._user is None:
            raise Exception(
                "MqTLS: error in publish, use mpublish in master mode")
        msg = "MQS1" + self.__len2(topic) + topic + \
            str(slot) + self.__len2(message) + message
        rx = None
        with self._lock:
            try:
                self.__send(msg)
                rx = self.__receive()
            except Exception:
                self.__connect()
                self.__send(msg)
                rx = self.__receive()
            finally:
                if rx is None:
                    raise Exception("MqTLS: error in publish")
                rx = rx.decode("utf-8")
                if len(rx) < 4:
                    return False
                if rx[:4] == "MQS1":
                    return True

    def retrieve(self, topic, slot):
        if self._user is None:
            raise Exception(
                "MqTLS: error in retrieve, use mretrieve in master mode")
        msg = "MQS7" + self.__len2(topic) + topic + str(slot)
        rx = None
        with self._lock:
            try:
                self.__send(msg)
                rx = self.__receive()
            except Exception:
                self.__connect()
                self.__send(msg)
                rx = self.__receive()
            finally:
                if rx is None:
                    raise Exception("MqTLS: error in retrieve")
                rx = rx.decode("utf-8")
                if len(rx) < 4:
                    return None
                if rx[:4] == "MQS7":
                    return None
                if rx[:4] == "MQS2":
                    return rx[6:6+int(rx[4:6])]

    def mpublish(self, topic, slot, message):
        msg = "MQS6" + self.__len2(topic) + topic + \
            str(slot) + self.__len2(message) + message
        rx = None
        with self._lock:
            try:
                self.__send(msg)
                rx = self.__receive()
            except Exception:
                self.__connect()
                self.__send(msg)
                rx = self.__receive()
            finally:
                if rx is None:
                    raise Exception("MqTLS: error in mpublish")
                rx = rx.decode("utf-8")
                if len(rx) < 4:
                    return False
                if rx[:4] == "MQS6":
                    return True

    def mretrieve(self, topic, slot):
        msg = "MQS7" + self.__len2(topic) + topic + str(slot)
        rx = None
        with self._lock:
            try:
                self.__send(msg)
                rx = self.__receive()
            except Exception:
                self.__connect()
                self.__send(msg)
                rx = self.__receive()
            finally:
                if rx is None:
                    raise Exception("MqTLS: error in mretrieve")
                rx = rx.decode("utf-8")
                if len(rx) < 4:
                    return None
                if rx[:4] == "MQS7":
                    return None
                if rx[:4] == "MQS2":
                    return rx[6:6+int(rx[4:6])]

    def muser(self, user):
        msg = "MQS8" + self.__len2(user) + user
        rx = None
        with self._lock:
            try:
                self.__send(msg)
                rx = self.__receive()
            except Exception:
                self.__connect()
                self.__send(msg)
                rx = self.__receive()
            finally:
                if rx is None:
                    raise Exception("MqTLS: error in user update")
                rx = rx.decode("utf-8")
                if len(rx) < 4:
                    return False
                if rx[:4] == "MQS8":
                    return True
                return False

    def macls(self, user):
        msg = "MQS9" + self.__len2(user) + user
        rx = None
        with self._lock:
            try:
                self.__send(msg)
                rx = self.__receive()
            except Exception:
                self.__connect()
                self.__send(msg)
                rx = self.__receive()
            finally:
                if rx is None:
                    raise Exception("MqTLS: error in acls update")
                rx = rx.decode("utf-8")
                if len(rx) < 4:
                    return False
                if rx[:4] == "MQS9":
                    return True
                return False
