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

rules = [
    (abs_path(r"/?"), neonsrv.interface.RootHandler),
    (abs_path(r"/editor/(.*?)"), neonsrv.interface.EditorHandler),
    (abs_path(r"/file/(.*?)"), neonsrv.interface.FileHandler),
    (abs_path(r"/revert/(.*?)"), neonsrv.interface.FileRevertHandler),
    (abs_path(r"/edit/(.*?)/insert/neume"), neonsrv.api.InsertNeumeHandler),
    (abs_path(r"/edit/(.*?)/move/neume"), neonsrv.api.ChangeNeumePitchHandler),
    (abs_path(r"/edit/(.*?)/delete/neume"), neonsrv.api.DeleteNeumeHandler),
    (abs_path(r"/edit/(.*?)/neumify"), neonsrv.api.NeumifyNeumeHandler),
    (abs_path(r"/edit/(.*?)/ungroup"), neonsrv.api.UngroupNeumeHandler),
    (abs_path(r"/edit/(.*?)/insert/division"), neonsrv.api.InsertDivisionHandler),
    (abs_path(r"/edit/(.*?)/delete/division"), neonsrv.api.DeleteDivisionHandler)
]

# Set up tests if we're in debug mode
if conf.DEBUG:
    class TestHandler(tornado.web.RequestHandler):
        def get(self):
            self.render("../test/neontest.html", prefix=conf.APP_ROOT.rstrip("/"))
    test_static = os.path.join(os.path.dirname(__file__), "test")
    rules.append((abs_path(r"/test/(.*)"), tornado.web.StaticFileHandler, {"path": test_static}))
    rules.append((abs_path(r"/test"), TestHandler))

application = tornado.web.Application(rules, **settings)

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
