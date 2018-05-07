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
    (abs_path(r"/editor/(.*?)"), neonsrv.interface.SquareNoteEditorHandler),
    (abs_path(r"/stafflesseditor/(.*?)"), neonsrv.interface.StafflessEditorHandler),
    (abs_path(r"/file/(.*)/(.*?)"), neonsrv.interface.DemoFileHandler),
    (abs_path(r"/file/(.*?)"), neonsrv.interface.FileHandler),
    (abs_path(r"/delete/(.*?)"), neonsrv.interface.DeleteFileHandler),
    (abs_path(r"/edit/(.*?)/(.*?)/revert"), neonsrv.interface.FileRevertHandler),
    # (abs_path(r"/edit/(.*?)/(.*?)/undo"), neonsrv.tornadoapi.FileUndoHandler),
    # (abs_path(r"/edit/(.*?)/(.*?)/deleteundo"), neonsrv.tornadoapi.DeleteUndosHandler),
    (abs_path(r"/edit/(.*?)/insert/neume"), neonsrv.tornadoapi.InsertNeumeHandler),
    (abs_path(r"/edit/(.*?)/move/neume"), neonsrv.tornadoapi.ChangeNeumePitchHandler),
    (abs_path(r"/edit/(.*?)/delete/neume"), neonsrv.tornadoapi.DeleteNeumeHandler),
    (abs_path(r"/edit/(.*?)/update/neume/headshape"), neonsrv.tornadoapi.UpdateNeumeHeadShapeHandler),
    (abs_path(r"/edit/(.*?)/neumify"), neonsrv.tornadoapi.NeumifyNeumeHandler),
    (abs_path(r"/edit/(.*?)/ungroup"), neonsrv.tornadoapi.UngroupNeumeHandler),
    (abs_path(r"/edit/(.*?)/insert/division"), neonsrv.tornadoapi.InsertDivisionHandler),
    (abs_path(r"/edit/(.*?)/move/division"), neonsrv.tornadoapi.MoveDivisionHandler),
    (abs_path(r"/edit/(.*?)/delete/division"), neonsrv.tornadoapi.DeleteDivisionHandler),
    (abs_path(r"/edit/(.*?)/update/division/shape"), neonsrv.tornadoapi.UpdateDivisionShapeHandler),
    (abs_path(r"/edit/(.*?)/insert/dot"), neonsrv.tornadoapi.AddDotHandler),
    (abs_path(r"/edit/(.*?)/delete/dot"), neonsrv.tornadoapi.DeleteDotHandler),
    (abs_path(r"/edit/(.*?)/insert/episema"), neonsrv.tornadoapi.AddEpisemaHandler),
    (abs_path(r"/edit/(.*?)/insert/episema"), neonsrv.tornadoapi.AddEpisemaHandler),
    (abs_path(r"/edit/(.*?)/delete/episema"), neonsrv.tornadoapi.DeleteEpisemaHandler),
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
    (abs_path(r"/edit/(.*?)/update/system/zone"), neonsrv.tornadoapi.UpdateSystemZoneHandler),
    (abs_path(r"\/?(.*?)"), neonsrv.interface.RootHandler)
]

# Set up tests if we're in debug mode
if conf.DEBUG:
    class TestHandler(tornado.web.RequestHandler):
        def get(self):
            self.render("../test/neontest.html", prefix=conf.APP_ROOT.rstrip("/"))
    test_static = os.path.join(os.path.dirname(__file__), "test")
    rules.append((abs_path(r"/test/(.*)"), tornado.web.StaticFileHandler, {"path": test_static}))
    rules.append((abs_path(r"/test"), TestHandler))

if __name__ == "__main__":
    import sys

    port = 8080

    if len(sys.argv) > 1:
        port = int(sys.argv[1])

    visible_pages = []
    default = ""

    #if debug is on, either main page template can be loaded
    #else if demo is on, that's the default and index can't be loaded
    #else we assume production mode and only allow index.html
    if conf.DEBUG_NEON:
        visible_pages.append("demo.html")
        visible_pages.append("index.html")
        if conf.DEMO:
            default = "demo.html"
        else:
            default = "index.html"
    else:
        if conf.DEMO:
            visible_pages.append("demo.html")
            default = "demo.html"
        else:
            visible_pages.append("index.html")
            default = "index.html"

    settings["visible_pages"] = visible_pages
    settings["default"] = default

    application = tornado.web.Application(rules, **settings)
    
    server = tornado.httpserver.HTTPServer(application)
    server.listen(port)
    tornado.ioloop.IOLoop.instance().start()
