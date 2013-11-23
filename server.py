#!/usr/bin/python

import os

import tornado.httpserver
import tornado.ioloop
import tornado.web

import conf
import neonsrv.interface
import neonsrv.tornadoapi

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
    (abs_path(r"/editor/(.*?)"), neonsrv.interface.SquareNoteEditorHandler),
    (abs_path(r"/stafflesseditor/(.*?)"), neonsrv.interface.StafflessEditorHandler),
    (abs_path(r"/file/(.*?)/(.*?)"), neonsrv.interface.FileHandler),
    (abs_path(r"/edit/(.*?)/(.*?)/revert"), neonsrv.interface.FileRevertHandler),
    (abs_path(r"/edit/(.*?)/insert/neume"), neonsrv.tornadoapi.InsertNeumeHandler),
    (abs_path(r"/edit/(.*?)/move/neume"), neonsrv.tornadoapi.ChangeNeumePitchHandler),
    (abs_path(r"/edit/(.*?)/delete/neume"), neonsrv.tornadoapi.DeleteNeumeHandler),
    (abs_path(r"/edit/(.*?)/update/neume/headshape"), neonsrv.tornadoapi.UpdateNeumeHeadShapeHandler),
    (abs_path(r"/edit/(.*?)/neumify"), neonsrv.tornadoapi.NeumifyNeumeHandler),
    (abs_path(r"/edit/(.*?)/ungroup"), neonsrv.tornadoapi.UngroupNeumeHandler),
    (abs_path(r"/edit/(.*?)/insert/division"), neonsrv.tornadoapi.InsertDivisionHandler),
    (abs_path(r"/edit/(.*?)/move/division"), neonsrv.tornadoapi.MoveDivisionHandler),
    (abs_path(r"/edit/(.*?)/delete/division"), neonsrv.tornadoapi.DeleteDivisionHandler),
    (abs_path(r"/edit/(.*?)/insert/dot"), neonsrv.tornadoapi.AddDotHandler),
    (abs_path(r"/edit/(.*?)/delete/dot"), neonsrv.tornadoapi.DeleteDotHandler),
    (abs_path(r"/edit/(.*?)/insert/clef"), neonsrv.tornadoapi.InsertClefHandler),
    (abs_path(r"/edit/(.*?)/move/clef"), neonsrv.tornadoapi.MoveClefHandler),
    (abs_path(r"/edit/(.*?)/update/clef/shape"), neonsrv.tornadoapi.UpdateClefShapeHandler),
    (abs_path(r"/edit/(.*?)/delete/clef"), neonsrv.tornadoapi.DeleteClefHandler),
    (abs_path(r"/edit/(.*?)/insert/custos"), neonsrv.tornadoapi.InsertCustosHandler),
    (abs_path(r"/edit/(.*?)/move/custos"), neonsrv.tornadoapi.MoveCustosHandler),
    (abs_path(r"/edit/(.*?)/delete/custos"), neonsrv.tornadoapi.DeleteCustosHandler),
    (abs_path(r"/edit/(.*?)/insert/system"), neonsrv.tornadoapi.InsertSystemHandler),
    (abs_path(r"/edit/(.*?)/insert/systembreak"), neonsrv.tornadoapi.InsertSystemBreakHandler),
    (abs_path(r"/edit/(.*?)/modify/systembreak"), neonsrv.tornadoapi.ModifySystemBreakHandler),
    (abs_path(r"/edit/(.*?)/delete/systembreak"), neonsrv.tornadoapi.DeleteSystemBreakHandler),
    (abs_path(r"/edit/(.*?)/delete/system"), neonsrv.tornadoapi.DeleteSystemHandler),
    (abs_path(r"/edit/(.*?)/update/system/zone"), neonsrv.tornadoapi.UpdateSystemZoneHandler)
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
