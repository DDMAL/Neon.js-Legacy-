import os

from modifymei import ModifyDocument

import tornado.web
import json

import conf

#####################################################
#              NEUME HANDLER CLASSES                #
#####################################################
class InsertNeumeHandler(tornado.web.RequestHandler):

    def post(self, file):
        before_id = str(self.get_argument("beforeid", None))
        pname = str(self.get_argument("pname", ""))
        oct = str(self.get_argument("oct", ""))
        dot_form = self.get_argument("dotform", None)

        # Bounding box
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        result = md.insert_punctum(before_id, pname, oct, dot_form, ulx, uly, lrx, lry)
        md.write_doc()

        self.write(json.dumps(result))
        self.set_status(200)

class ChangeNeumePitchHandler(tornado.web.RequestHandler):

    def post(self, file):
        data = json.loads(self.get_argument("data", ""))

        id = str(data["id"])
        before_id = str(data["beforeid"])
        
        # Bounding box
        ulx = str(data["ulx"])
        uly = str(data["uly"])
        lrx = str(data["lrx"])
        lry = str(data["lry"])

        pitch_info = data["pitchInfo"]

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.move_neume(id, before_id, pitch_info, ulx, uly, lrx, lry)
        md.write_doc()

        self.set_status(200)

class DeleteNeumeHandler(tornado.web.RequestHandler):

    def post(self, file):
        ids = str(self.get_argument("ids", ""))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.delete_neume(ids.split(","))
        md.write_doc()

        self.set_status(200)

class NeumifyNeumeHandler(tornado.web.RequestHandler):

    def post(self, file):        
        nids = str(self.get_argument("nids", "")).split(",")
        neume_name = str(self.get_argument("name", ""))
        
        # Bounding box
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        result = md.neumify(nids, neume_name, ulx, uly, lrx, lry)
        md.write_doc()

        self.write(json.dumps(result))
        self.set_status(200)

class UngroupNeumeHandler(tornado.web.RequestHandler):

    def post(self, file):
        data = json.loads(self.get_argument("data", ""))

        nids = str(data["nids"]).split(",")
        bboxes = data["bbs"]

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        result = md.ungroup(nids, bboxes)
        md.write_doc()

        self.write(json.dumps(result))

        self.set_status(200)

#####################################################
#              DIVISION HANDLER CLASSES             #
#####################################################
class InsertDivisionHandler(tornado.web.RequestHandler):

    def post(self, file):
        div_type = str(self.get_argument("type", ""))
        before_id = str(self.get_argument("beforeid", None))

        # bounding box
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        result = md.insert_division(before_id, div_type, ulx, uly, lrx, lry)
        md.write_doc()

        self.write(json.dumps(result))
        self.set_status(200)

class MoveDivisionHandler(tornado.web.RequestHandler):

    def post(self, file):
        id = str(self.get_argument("id", ""))
        before_id = str(self.get_argument("beforeid", None))

        # bounding box
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.move_division(id, before_id, ulx, uly, lrx, lry)
        md.write_doc()

        self.set_status(200)

class DeleteDivisionHandler(tornado.web.RequestHandler):

    def post(self, file):
        ids = str(self.get_argument("ids", ""))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.delete_division(ids.split(","))
        md.write_doc()

        self.set_status(200)

class AddDotHandler(tornado.web.RequestHandler):

    def post(self, file):  
        id = str(self.get_argument("id", ""))
        dot_form = str(self.get_argument("dotform", ""))

        # Bounding box
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.add_dot(id, dot_form, ulx, uly, lrx, lry)
        md.write_doc()

        self.set_status(200)

class DeleteDotHandler(tornado.web.RequestHandler):

    def post(self, file):
        id = str(self.get_argument("id", ""))

        # Bounding box
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.delete_dot(id, ulx, uly, lrx, lry)
        md.write_doc()

        self.set_status(200)

#####################################################
#              CLEF HANDLER CLASSES                 #
#####################################################
class MoveClefHandler(tornado.web.RequestHandler):

    def post(self, file):
        data = json.loads(self.get_argument("data", ""))
        clef_id = str(data["id"])
        
        # bounding box
        ulx = str(data["ulx"])
        uly = str(data["uly"])
        lrx = str(data["lrx"])
        lry = str(data["lry"])

        line = str(data["line"])

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.move_clef(clef_id, line, data["pitchInfo"], ulx, uly, lrx, lry)
        md.write_doc()

        self.set_status(200)

class UpdateClefShapeHandler(tornado.web.RequestHandler):

    def post(self, file):        
        data = json.loads(self.get_argument("data", ""))
        clef_id = str(data["id"])

        # bounding box
        ulx = str(data["ulx"])
        uly = str(data["uly"])
        lrx = str(data["lrx"])
        lry = str(data["lry"])

        shape = str(data["shape"])

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.update_clef_shape(clef_id, shape, data["pitchInfo"], ulx, uly, lrx, lry)
        md.write_doc()

        self.set_status(200)

class InsertClefHandler(tornado.web.RequestHandler):

    def post(self, file):
        data = json.loads(self.get_argument("data", ""))
        shape = str(data["shape"]).upper()
        line = str(data["line"])
        before_id = str(data["beforeid"])

        # bounding box
        ulx = str(data["ulx"])
        uly = str(data["uly"])
        lrx = str(data["lrx"])
        lry = str(data["lry"])

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        result = md.insert_clef(line, shape, data["pitchInfo"], before_id, ulx, uly, lrx, lry)
        md.write_doc()

        self.write(json.dumps(result))

        self.set_status(200)

class DeleteClefHandler(tornado.web.RequestHandler):
    def post(self, file):
        clefs_to_delete = json.loads(self.get_argument("data", ""))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.delete_clef(clefs_to_delete)
        md.write_doc()

        self.set_status(200)

#####################################################
#              CUSTOS HANDLER CLASSES               #
#####################################################
class InsertCustosHandler(tornado.web.RequestHandler):

    def post(self, file):
        pname = str(self.get_argument("pname", ""))
        oct = str(self.get_argument("oct", ""))
        before_id = str(self.get_argument("beforeid", None))

        # bounding box
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        result = md.insert_custos(pname, oct, before_id, ulx, uly, lrx, lry)
        md.write_doc()

        self.write(json.dumps(result))

        self.set_status(200)

class MoveCustosHandler(tornado.web.RequestHandler):

    def post(self, file):
        custos_id = str(self.get_argument("id", ""))
        pname = self.get_argument("pname", None)
        oct = self.get_argument("oct", None)

        # bounding box
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.move_custos(custos_id, pname, oct, ulx, uly, lrx, lry)
        md.write_doc()

        self.set_status(200)

class DeleteCustosHandler(tornado.web.RequestHandler):

    def post(self, file):
        custos_id = str(self.get_argument("id", ""))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.delete_custos(custos_id)
        md.write_doc()

        self.set_status(200)
