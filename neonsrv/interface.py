import json
import mimetypes
import os

import pymei.Import.xmltomei
import pymei.Export.meitojson

import tornado.web

import conf

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
        self.render("index.html", files=self.get_files(), errors="", prefix=conf.get_prefix())

    def post(self):
        mei = self.request.files.get("mei", [])
        mei_img = self.request.files.get("mei_img", [])
        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        errors = ""
        mei_fn = ""
        if len(mei):
            mei_fn = mei[0]["filename"]
            contents = mei[0]["body"]
            try:
                mei = pymei.Import.xmltomei.xmlstrtomei(contents)
                if os.path.exists(os.path.join(mei_directory, mei_fn)):
                    errors = "mei file already exists"
                else:
                    fp = open(os.path.join(mei_directory, mei_fn), "w")
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
                if os.path.exists(os.path.join(mei_directory, img_fn)):
                    errors += "image file already exists"
                else:
                    fp = open(os.path.join(mei_directory, img_fn), "w")
                    fp.write(img_contents)
                    fp.close()
            except Exception, e:
                errors += "invalid image file"

        self.render("index.html", files=self.get_files(), errors=errors, prefix=conf.get_prefix())

class EditorHandler(tornado.web.RequestHandler):
    def get(self, page):
        debug = self.get_argument("debug", None)
        if debug:
            dstr = "true"
        else:
            dstr = "false"
        self.render("neon.html", page=page, debug=dstr, prefix=conf.get_prefix())

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

