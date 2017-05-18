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
        before_id = self.get_argument("beforeid", None)
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

class UpdateNeumeHeadShapeHandler(tornado.web.RequestHandler):

    def post(self, file):
        id = str(self.get_argument("id", ""))
        head_shape = str(self.get_argument("shape", ""))
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.update_neume_head_shape(id, head_shape, ulx, uly, lrx, lry)
        md.write_doc()

        self.set_status(200)

class NeumifyNeumeHandler(tornado.web.RequestHandler):

    def post(self, file):        
        data = json.loads(self.get_argument("data", ""))
        nids = str(data["nids"]).split(",")
        type_id = str(data["typeid"])
        liquescence = str(data.get("liquescence", None))
        head_shapes = data["headShapes"]

        try:
            lrx = str(data["lrx"])
            lry = str(data["lry"])
            ulx = str(data["ulx"])
            uly = str(data["uly"])
        except KeyError:
            ulx = uly = lrx = lry = None
        
        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        result = md.neumify(nids, type_id, liquescence, head_shapes, ulx, uly, lrx, lry)
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
        shape = str(self.get_argument("shape", "")).upper()
        line = str(self.get_argument("line", ""))
        before_id = self.get_argument("beforeid", None)
        pitchInfo = str(self.get_argument("pitchInfo", ""))

        # bounding box
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        result = md.insert_clef(line, shape, pitchInfo, before_id, ulx, uly, lrx, lry)
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
        pname = self.get_argument("pname", "")
        oct = self.get_argument("oct", "")

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
        custos_ids = str(self.get_argument("ids", "")).split(",")

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.delete_custos(custos_ids)
        md.write_doc()

        self.set_status(200)

#####################################################
#           STAFF/SYSTEM HANDLER CLASSES            #
#####################################################
class InsertSystemHandler(tornado.web.RequestHandler):

    def post(self, file):
        page_id = str(self.get_argument("pageid", None))
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        result = md.insert_system(page_id, ulx, uly, lrx, lry)
        md.write_doc()

        self.write(json.dumps(result))

        self.set_status(200)

class InsertSystemBreakHandler(tornado.web.RequestHandler):

    def post(self, file):
        system_id = self.get_argument("systemid", None)
        order_number = self.get_argument("ordernumber", None)
        next_sb_id = self.get_argument("nextsbid", None)

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        result = md.insert_system_break(system_id, order_number, next_sb_id)
        md.write_doc()

        self.write(json.dumps(result))

        self.set_status(200)

class ModifySystemBreakHandler(tornado.web.RequestHandler):

    def post(self, file):
        sb_id = str(self.get_argument("sbid"))
        order_number = str(self.get_argument("ordernumber"))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        result = md.modify_system_break(sb_id, order_number)
        md.write_doc()

        self.write(json.dumps(result))

        self.set_status(200)

class DeleteSystemBreakHandler(tornado.web.RequestHandler):

    def post(self, file):
        sb_ids = str(self.get_argument("sbids", "")).split(",")

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.delete_system(sb_ids)
        md.write_doc()

        self.set_status(200)

class DeleteSystemHandler(tornado.web.RequestHandler):

    def post(self, file):
        system_ids = str(self.get_argument("sids", "")).split(",")
        
        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.delete_system(system_ids)
        md.write_doc()

        self.set_status(200)

class UpdateSystemZoneHandler(tornado.web.RequestHandler):

    def post(self, file):
        system_id = str(self.get_argument("sid"))
        ulx = str(self.get_argument("ulx"))
        uly = str(self.get_argument("uly"))
        lrx = str(self.get_argument("lrx"))
        lry = str(self.get_argument("lry"))
        
        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.update_system_zone(system_id, ulx, uly, lrx, lry)
        md.write_doc()

        self.set_status(200)
