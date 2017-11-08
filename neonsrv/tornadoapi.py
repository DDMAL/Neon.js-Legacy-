
#############################
# Begin addition -- Ling-Xiao Yang
#
# Mock several classes and functions to let the original code work with Rodan,
# as I don't want to modify the code.
############################
import os

class conf:
   MEI_DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(__file__), "../static/MEI_DIRECTORY"))
class tornado:
    class web:
        class RequestHandler(object):
            def __init__(self, user_input):
                self.user_input = user_input
                self.response_content = ''
            def get_argument(self, name, default=None):
                return self.user_input.get(name, default)
            def write(self, content):
                self.response_content = content
            def set_status(self, status):
                pass


#############################
# End addition -- Ling-Xiao Yang
#############################
from modifymei import ModifyDocument
import shutil
import json


#####################################################
#              NEUME HANDLER CLASSES                #
#####################################################
class InsertNeumeHandler(tornado.web.RequestHandler):

    def post(self, file):
        name = str(self.get_argument("name", ""))
        inclinatum = self.get_argument("inclinatum", None)
        deminutus = self.get_argument("deminutus", None)
        before_id = self.get_argument("beforeid", None)
        pname = str(self.get_argument("pname", ""))
        oct = str(self.get_argument("oct", ""))
        dot_form = self.get_argument("dotform", None)
        episema_form = self.get_argument("episemaform", None)
        id = self.get_argument("id", None)

        # Bounding box
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        result = md.insert_punctum(name, inclinatum, deminutus, before_id, pname, oct, dot_form, episema_form, ulx, uly, lrx, lry)
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
        before_id = self.get_argument("beforeid", None)

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

class UpdateDivisionShapeHandler(tornado.web.RequestHandler):

    def post(self, file):
        data = json.loads(self.get_argument("data", ""))
        div_type = str(data["type"])
        id = str(data["id"])

        # bounding box
        lrx = str(data["lrx"])
        lry = str(data["lry"])
        ulx = str(data["ulx"])
        uly = str(data["uly"])

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.update_division_shape(id, div_type, ulx, uly, lrx, lry)
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

class AddEpisemaHandler(tornado.web.RequestHandler):

    def post(self, file):
        id = str(self.get_argument("id", ""))
        episema_form = str(self.get_argument("episemaform", ""))

        # Bounding box
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        md = ModifyDocument(fname)
        md.add_episema(id, episema_form, ulx, uly, lrx, lry)
        md.write_doc()

        self.set_status(200)

class DeleteEpisemaHandler(tornado.web.RequestHandler):

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
        md.delete_episema(id, ulx, uly, lrx, lry)
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
        shape = str(data["shape"])
        line = str(data["line"])
        before_id = str(data["beforeid"])
        pitchInfo = data["pitchInfo"]

        # bounding box
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
        before_id = self.get_argument("beforeid", None)

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

class FileUndoHandler(tornado.web.RequestHandler):
    def post(self, filename):
        '''
        Move the given filename from the undo directory to the
        working directory. Overwrites changes made by the editor!
        '''

        mei_directory = os.path.join(os.path.abspath(conf.MEI_DIRECTORY))
        meiworking = os.path.join(mei_directory, filename)
        mei_directory_undo = mei_directory + "/undo"

        file_list = [f for f in os.listdir(mei_directory_undo)
                     if os.path.isfile(os.path.join(mei_directory_undo, f))]

        list_length = len(file_list)

        filename_split_initial = os.path.split(filename)
        filename_dir, mei_filename = filename_split_initial

        in_demo = (mei_filename != "original_file.mei.working")
        if in_demo:
            mei_directory_undo = conf.MEI_DIRECTORY + "/undo/"
        else:
            mei_directory_undo = os.path.join(filename_dir, "undo/")

    
        # if list_length > 1:
        #     if list_length < 10:
        #         meicurrent = os.path.join(mei_directory_undo, mei_filename + "_0" + str(list_length))
        #         meiundo = os.path.join(mei_directory_undo, mei_filename + "_0" + str(list_length - 1))
        #     elif list_length == 10:
        #         meicurrent = os.path.join(mei_directory_undo, mei_filename + "_" + str(list_length))
        #         meiundo = os.path.join(mei_directory_undo, mei_filename + "_0" + str(list_length - 1))
        #     else:
        #         meicurrent = os.path.join(mei_directory_undo, mei_filename + "_" + str(list_length))
        #         meiundo = os.path.join(mei_directory_undo, mei_filename + "_" + str(list_length - 1))

        #     if meiundo:
        #         shutil.copy(meiundo, meiworking)

        #     os.remove(meicurrent)

        # else:
        if list_length > 1:
            if list_length < 10:
                meicurrent = os.path.join(mei_directory_undo, filename + "_0" + str(list_length) + ".mei")
                meiundo = os.path.join(mei_directory_undo, filename + "_0" + str(list_length - 1) + ".mei")
            elif list_length == 10:
                meicurrent = os.path.join(mei_directory_undo, filename + "_" + str(list_length) + ".mei")
                meiundo = os.path.join(mei_directory_undo, filename + "_0" + str(list_length - 1) + ".mei")
            else:
                meicurrent = os.path.join(mei_directory_undo, filename + "_" + str(list_length) + ".mei")
                meiundo = os.path.join(mei_directory_undo, filename + "_" + str(list_length - 1) + ".mei")

            if meiundo:
                shutil.copy(meiundo, meiworking)

            os.remove(meicurrent)

class DeleteUndosHandler(tornado.web.RequestHandler):
    def post(self, filename):
        mei_directory = os.path.join(os.path.abspath(conf.MEI_DIRECTORY))
        meiworking = os.path.join(mei_directory, filename)
        mei_directory_undo = mei_directory + "/undo"

        file_list = [f for f in os.listdir(mei_directory_undo)
                     if os.path.isfile(os.path.join(mei_directory_undo, f))]

        if len(file_list) != 0:
            for f in file_list:
                os.remove(mei_directory_undo + "/" + f)

        file_list = [f for f in os.listdir(mei_directory_undo) 
                     if os.path.isfile(os.path.join(mei_directory_undo, f))]


        if len(file_list) == 0:
            filename_split_initial = os.path.split(filename)
            filename_dir, mei_filename = filename_split_initial

            if mei_filename == "original_file.mei.working":
                meiundo = mei_directory_undo + "/" + mei_filename +"_0" + str(1)

            else:
                meiundo = os.path.join(mei_directory_undo, filename + "_0" + str(1))

            if meiundo:
                shutil.copy(meiworking, meiundo)
