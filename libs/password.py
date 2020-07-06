import hashlib
import uuid


def createHash(string):
    salt = uuid.uuid4().hex
    return hashlib.sha256(salt.encode() + string.encode()).hexdigest() + salt


def checkHash(hash, string):
    if hashlib.sha256(hash[64:].encode() + string.encode()).hexdigest() == hash[0:64]:
        return True
    return False
