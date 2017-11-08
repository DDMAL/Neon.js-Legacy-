#!/usr/bin/python
import socket
from kombu import Connection

user = "root"
password = "root"
vhost = "rodan"
host = "localhost"
port = 5672
url = 'amqp://{0}:{1}@{2}:{3}/{4}'.format(user, password, host, port, vhost)

with Connection(url) as c:
    try:
        c.connect()
    except socket.error:
        raise ValueError("Requested, but no reply.")
    except IOError:
        raise ValueError("Check Variables.")
    else:
        print ("Eurika! It works!")