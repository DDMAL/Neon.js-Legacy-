#!/usr/bin/python

import tornado.httpserver
import tornado.ioloop
import tornado.web

import json
import os

import pymei.Import.xmltomei
import pymei.Export.meitojson

import conf

class RootHandler(tornado.web.RequestHandler):
    def get_files(self):
        dir = os.path.abspath(conf.MEI_DIRECTORY)
        files = os.listdir(dir)
        newfiles = []
        for f in files:
            try:
                mei = pymei.Import.xmltomei.xmltomei(os.path.join(dir, f))
                newfiles.append(f)
            except Exception, e:
                pass
        return newfiles

    def get(self):
        self.render("templates/index.html", files=self.get_files(), errors="")

    def post(self):
        mei = self.request.files.get("mei", [])
        errors = ""
        if len(mei):
            fn = mei[0]["filename"]
            contents = mei[0]["body"]
            dir = os.path.abspath(conf.MEI_DIRECTORY)
            if os.path.exists(os.path.join(dir, fn)):
                errors = "file already exists"
            else:
                fp = open(os.path.join(dir, fn), "w")
                fp.write(contents)
                fp.close()
        self.render("templates/index.html", files=self.get_files(), errors=errors)

class EditorHandler(tornado.web.RequestHandler):
    def get(self, page):
        print page
        self.render("templates/neon.html", page=page)

class MeiFileHandler(tornado.web.RequestHandler):
    def get(self, filename):
        fullpath = os.path.join(conf.MEI_DIRECTORY, filename)
        if not os.path.exists(os.path.abspath(fullpath)):
            self.send_error(403)
        else:
            mei = pymei.Import.xmltomei.xmltomei(fullpath)
            response = pymei.Export.meitojson.meitojson(mei, prettyprint=False)
            self.set_header("Content-Type", "application/json")
            self.write(response)

settings = {
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    "debug": conf.DEBUG,
    "cookie_secret": "ONEcookieAHAHAHAHTWOcookiesAHAHAHAH",
    "gzip": True
}

def abs_path(relpath):
    root = conf.APP_ROOT.rstrip("/")
    return r"%s%s" % (root, relpath)

application = tornado.web.Application([
    (abs_path(r"/?"), RootHandler),
    (abs_path(r"/(.*?)/edit"), EditorHandler),
    (abs_path(r"/(.*?)/mei"), MeiFileHandler),
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
