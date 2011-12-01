#!/usr/bin/python

import tornado.httpserver
import tornado.ioloop
import tornado.web

import json
import os

import conf

class RootHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("templates/index.html")

class EditorHandler(tornado.web.RequestHandler):
    def get(self, page):
        print page
        self.render("templates/neon.html", page=page)

settings = {
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    "debug": conf.DEBUG,
    "cookie_secret": "ONEcookieAHAHAHAHTWOcookiesAHAHAHAH"
}

def abs_path(relpath):
    root = conf.APP_ROOT.rstrip("/")
    return r"%s%s" % (root, relpath)

application = tornado.web.Application([
    (abs_path(r"/?"), RootHandler),
    (abs_path(r"/(.*?)/edit"), EditorHandler),
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
