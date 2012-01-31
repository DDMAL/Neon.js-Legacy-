#!/usr/bin/python

import tornado.httpserver
import tornado.ioloop
import tornado.web

import json
import os
import mimetypes

import pymei.Import.xmltomei
import pymei.Export.meitojson

import conf

assert tornado.version_info > (2, 0, 0)

class RootHandler(tornado.web.RequestHandler):
    def get_files(self):
        dir = os.path.abspath(conf.MEI_DIRECTORY)
        # only list mei files (not jpeg)
        meiFiles = []
        for f in os.listdir(dir):
            if f.endswith(".mei"):
                meiFiles.append(f)
        return meiFiles

    def get(self):
        self.render("templates/index.html", files=self.get_files(), errors="", prefix=conf.APP_ROOT.rstrip("/"))

    def post(self):
        mei = self.request.files.get("mei", [])
        mei_img = self.request.files.get("mei_img", [])
        dir = os.path.abspath(conf.MEI_DIRECTORY)
        errors = ""
        mei_fn = ""
        if len(mei):
            mei_fn = mei[0]["filename"]
            contents = mei[0]["body"]
            try:
                mei = pymei.Import.xmltomei.xmlstrtomei(contents)
                if os.path.exists(os.path.join(dir, mei_fn)):
                    errors = "mei file already exists"
                else:
                    fp = open(os.path.join(dir, mei_fn), "w")
                    fp.write(contents)
                    fp.close()
            except Exception, e:
                errors = "invalid mei file"

        if len(mei_img):
            # derive image filename from mei filename
            if mei_fn != "":
                img_fn = os.path.splitext(mei_fn)[0] + ".jpg"
            else:
                img_fn = mei_img[0]["filename"]
            img_contents = mei_img[0]["body"]
            try:
                if os.path.exists(os.path.join(dir, img_fn)):
                    errors += "image file already exists"
                else:
                    fp = open(os.path.join(dir, img_fn), "w")
                    fp.write(img_contents)
                    fp.close()
            except Exception, e:
                errors += "invalid image file"

        self.render("templates/index.html", files=self.get_files(), errors=errors, prefix=conf.APP_ROOT.rstrip("/"))

class EditorHandler(tornado.web.RequestHandler):
    def get(self, page):
        debug = self.get_argument("debug", None)
        if debug:
            dstr = "true"
        else:
            dstr = "false"
        self.render("templates/neon.html", page=page, prefix=conf.APP_ROOT.rstrip("/"), debug=dstr)

class FileHandler(tornado.web.RequestHandler):
    mimetypes.add_type("text/xml", ".mei")

    def get(self, filename):
        fullpath = os.path.join(conf.MEI_DIRECTORY, filename)
        if not os.path.exists(os.path.abspath(fullpath)):
            self.send_error(403)
        else:
            fp = open(fullpath, "r")
            response = fp.read()
            # derive mime type from file for generic serving
            self.set_header("Content-Type", mimetypes.guess_type(fullpath)[0]);
            self.write(response)
            # to serve JSON instead of xml
            #response = pymei.Export.meitojson.meitojson(mei, prettyprint=False)
            #self.set_header("Content-Type", "application/json")
            #self.write(response)

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
    (abs_path(r"/(.*?)/file"), FileHandler),
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
