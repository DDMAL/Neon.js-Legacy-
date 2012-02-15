#!/usr/bin/python

import os

import tornado.httpserver
import tornado.ioloop
import tornado.web

import conf
import neonsrv.interface
import neonsrv.api

assert tornado.version_info > (2, 0, 0)

settings = {
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    "template_path": os.path.join(os.path.dirname(__file__), "templates"),
    "static_url_prefix": conf.APP_ROOT + "static/",
    "debug": conf.DEBUG,
    "cookie_secret": "ONEcookieAHAHAHAHTWOcookiesAHAHAHAH",
    "gzip": True
}

def abs_path(relpath):
    root = conf.APP_ROOT.rstrip("/")
    return r"%s%s" % (root, relpath)

application = tornado.web.Application([
    (abs_path(r"/?"), neonsrv.interface.RootHandler),
    (abs_path(r"/editor/(.*?)"), neonsrv.interface.EditorHandler),
    (abs_path(r"/file/(.*?)"), neonsrv.interface.FileHandler),
    (abs_path(r"/edit/(.*?)/delete/note"), neonsrv.api.DeleteNoteHandler),
    ], **settings)

def main(port):
    server = tornado.httpserver.HTTPServer(application)
    server.listen(port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    else:
        port = 8080
    main(port)
