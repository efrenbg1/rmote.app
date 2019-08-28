import hashlib, base64

# Function to make a hash for security in the passwords
def make_hash(hash_string):
    sha_signature = \
        hashlib.sha256(hash_string.encode()).hexdigest()
    return sha_signature

#Function to check if the hash for the password is correct
def check_hash(password, hash):
    if hash == make_hash(password):
        return True
    return False

#Function to econde the password into base-64
def encode(key, clear):
    enc = []
    for i in range(len(clear)):
        key_c = key[i % len(key)]
        enc_c = chr((ord(clear[i]) + ord(key_c)) % 256)
        enc.append(enc_c)
    return str(base64.urlsafe_b64encode("".join(enc)))

#Function to decode the base-64 passwords into the initial one
def decode(key, enc):
    dec = []
    enc = base64.urlsafe_b64decode(enc)
    for i in range(len(enc)):
        key_c = key[i % len(key)]
        dec_c = chr((256 + ord(enc[i]) - ord(key_c)) % 256)
        dec.append(dec_c)
    return "".join(dec)