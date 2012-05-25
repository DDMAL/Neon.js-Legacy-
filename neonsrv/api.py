import os

from pymei import XmlImport
from pymei import XmlExport
from pymei import MeiElement
import tornado.web
import json

import conf

#####################################################
#              NEUME HANDLER CLASSES                #
#####################################################
class InsertNeumeHandler(tornado.web.RequestHandler):

    def create_new_punctum(self, pname, oct):
        '''
        Make a new punctum with the given pitch name and
        octave and return the MEI element
        '''
        punctum = MeiElement("neume")
        punctum.addAttribute("name", "punctum")
        nc = MeiElement("nc")
        note = MeiElement("note")
        note.addAttribute("pname", pname)
        note.addAttribute("oct", oct)
        punctum.addChild(nc)
        nc.addChild(note)

        return punctum

    def insert_punctum(self, punctum, beforeid):
        before = self.mei.getElementById(beforeid)

        # get layer element
        parent = before.getParent()

        if parent and before:
            parent.addChildBefore(before, punctum)
            
    def get_new_zone(self, ulx, uly, lrx, lry):
        zone = MeiElement("zone")
        zone.addAttribute("ulx", ulx)
        zone.addAttribute("uly", uly)
        zone.addAttribute("lrx", lrx)
        zone.addAttribute("lry", lry)

        return zone

    def add_zone(self, neume, zone):
        # add zone to the surfaces
        surfaces = self.mei.getElementsByName("surface")
        if len(surfaces) and zone:
            surfaces[0].addChild(zone)

        if zone:
            # add facs id to neume
            neume.addAttribute("facs", zone.getId())

    def post(self, file):
        '''
        Insert a punctum before the given element. There is one case where
        there is no element to insert before, when there is no subsequent staff.
        In this case, the element is inserted at the end of the last system.
        Also sets the bounding box information of the new punctum.
        '''

        beforeid = str(self.get_argument("beforeid", None))
        pname = str(self.get_argument("pname", ""))
        oct = str(self.get_argument("oct", ""))

        # Bounding box
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        self.mei = XmlImport.read(fname)

        punctum = self.create_new_punctum(pname, oct)
        zone = self.get_new_zone(ulx, uly, lrx, lry)
        self.add_zone(punctum, zone)
        
        if beforeid is None:
            # get last layer
            layers = self.mei.getElementsByName("layer")
            if len(layers):
                layers[-1].addChild(punctum)
        else:
            self.insert_punctum(punctum, beforeid)

        XmlExport.write(self.mei, fname)

        result = {"nid": punctum.getId()}
        self.write(json.dumps(result))
        self.set_status(200)

class ChangeNeumePitchHandler(tornado.web.RequestHandler):

    def neume_pitch_shift(self, neume, pitch_info):
        notes = neume.getDescendantsByName("note")
        if len(notes):
            for n, pinfo in zip(notes, pitch_info):
                n.addAttribute("pname", str(pinfo["pname"]))
                n.addAttribute("oct", str(pinfo["oct"]))

    def reposition_neume(self, neume, beforeid):
        # first remove the neume
        self.remove_neume(neume)

        if beforeid is None:
            # get last layer
            layers = self.mei.getElementsByName("layer")
            if len(layers):
                layers[-1].addChild(neume)
        else:
            self.insert_neume(neume, beforeid)

    def remove_neume(self, neume):
        parent = neume.getParent()
        parent.removeChild(neume)

    def insert_neume(self, neume, beforeid):
        before = self.mei.getElementById(beforeid)

        # get layer element
        parent = before.getParent()

        if parent and before:
            parent.addChildBefore(before, neume)

    def update_or_add_zone(self, neume, bb):
        facsid = neume.getAttribute("facs").value
        if facsid:
            zone = self.mei.getElementById(facsid)
        else:
            zone = MeiElement("zone")
            neume.addAttribute("facs", zone.getId())
            surfaces = self.mei.getElementsByName("surface")
            if len(surfaces):
                surfaces[0].addChild(zone)

        zone.addAttribute("ulx", str(bb["ulx"]))
        zone.addAttribute("uly", str(bb["uly"]))
        zone.addAttribute("lrx", str(bb["lrx"]))
        zone.addAttribute("lry", str(bb["lry"]))
        
    def post(self, file):
        data = json.loads(self.get_argument("data", ""))

        nid = str(data["nid"])
        beforeid = str(data["beforeid"])
        bb = data["bb"]
        pitch_info = data["pitchInfo"]

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        self.mei = XmlImport.read(fname)

        neume = self.mei.getElementById(nid)

        if pitch_info is not None:
            self.neume_pitch_shift(neume, pitch_info)

        self.reposition_neume(neume, beforeid)
        self.update_or_add_zone(neume, bb)

        XmlExport.write(self.mei, fname)

        self.set_status(200)

class DeleteNeumeHandler(tornado.web.RequestHandler):
    def delete_neume(self, neume):
        """ Delete a <neume> object from the model and also
        a <zone> element of the neume's facs attribute, if one
        exists.
        """
        facsid = neume.getAttribute("facs").value
        neume.parent.removeChild(neume)
        # Remove the zone if it exists
        zone = self.mei.getElementById(str(facsid))
        if zone and zone.name == "zone":
            zone.parent.removeChild(zone)

    def delete_note(self, note):
        """ Delete a <note> from the model. If its parent <nc> element
        is empty after this, delete the <nc>. If the parent <neume> is
        empty after this, delete the <neume>.
        """
        nc = note.parent
        if nc and nc.name == "nc":
            neume = nc.parent
            if neume and neume.name == "neume":
                # If we have neume -> nc -> note, remove the note.
                nc.removeChild(note)
                # Remove the nc and neume if they're empty
                if len(nc.children) == 0:
                    neume.removeChild(nc)
                if len(neume.children) == 0:
                    self.delete_neume(neume)

    def do_delete(self, ids):
        """ Delete the elements from the mei model that have the specified
        IDs. The IDs can be of <note> or <neume> objects.
        """
        for i in ids.split(","):
            element = self.mei.getElementById(str(i))
            if element and element.name == "note":
                self.delete_note(element)
            elif element and element.name == "neume":
                self.delete_neume(element)

    def post(self, file):
        """ Delete one or more <note> or <neume> elements.
        Pass in an argument called 'id' with a comma separated list of
        ids of note elements to delete.
        If the note's surrounding <nc> element is empty after this, remove it.
        If the nc's surrounding <neume> element is empty, remove it.
        Remove any <zone> elements whose ids are referenced by removed <neume>s.

        Does not reduce the size of the bounding box on a <zone> or change the neume
        type if it now has a different number of <note> elements.
        """
        todelete = self.get_argument("ids", "")

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)

        fname = os.path.join(mei_directory, file)
        self.mei = XmlImport.read(fname)
        self.do_delete(todelete)

        XmlExport.write(self.mei, fname)

        self.set_status(200)

class NeumifyNeumeHandler(tornado.web.RequestHandler):

    def create_new_neume(self, neumeids, neume_name):
        ''' 
        Make a new neume with notes from the neumes with
        ID's from neumeids and return the MEI object
        '''
        neume = MeiElement("neume")
        neume.addAttribute("name", neume_name)
        nc = MeiElement("nc")
        
        for i in neumeids:
            ref_neume = self.mei.getElementById(str(i))
            if ref_neume:
                # get underlying notes
                notes = ref_neume.getDescendantsByName("note")
                for n in notes:
                    nc.addChild(n)

        neume.addChild(nc)

        return neume

    def insert_neume(self, neume, beforeId):
        '''
        Insert neume into the MEI document before the first neume in the given
        ID list
        '''
        before = self.mei.getElementById(str(beforeId))
        parent = before.getParent()

        if before and parent:
            parent.addChildBefore(before, neume)

    def delete_old_neumes(self, neumeids):
        '''
        Delete the neumes with ids in neumeids and
        the associated facs data
        '''
        for i in neumeids:
            neume = self.mei.getElementById(str(i))
            if neume:
                # remove facs data
                facs = neume.getAttribute("facs")
                if facs:
                    facsid = facs.value
                    # Remove the zone if it exists
                    zone = self.mei.getElementById(str(facsid))
                    if zone and zone.name == "zone":
                        zone.parent.removeChild(zone)

                # now remove the neume
                neume.parent.removeChild(neume)
    
    def get_new_zone(self, ulx, uly, lrx, lry):
        zone = MeiElement("zone")
        zone.addAttribute("ulx", ulx)
        zone.addAttribute("uly", uly)
        zone.addAttribute("lrx", lrx)
        zone.addAttribute("lry", lry)

        return zone
        
    def add_zone(self, neume, zone):
        # add zone to the surfaces
        surfaces = self.mei.getElementsByName("surface")
        if len(surfaces) and zone:
            surfaces[0].addChild(zone)

        if zone:
            # add facs id to neume
            neume.addAttribute("facs", zone.getId())

    def post(self, file):
        '''
        Neumify a group of neumes (with provided ids)
        and give it the given neume name. Also update
        bounding box information.
        '''

        nids = str(self.get_argument("nids", "")).split(",")
        neume_name = str(self.get_argument("name", ""))
        
        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        self.mei = XmlImport.read(fname)

        neume = self.create_new_neume(nids, neume_name)
        self.insert_neume(neume, nids[0])
        self.delete_old_neumes(nids)

        # Bounding box
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))

        if lrx and lry and ulx and uly:
            zone = self.get_new_zone(ulx, uly, lrx, lry)
            self.add_zone(neume, zone)

        XmlExport.write(self.mei, fname)

        result = {"nid": neume.getId()}
        self.write(json.dumps(result))
        self.set_status(200)

class UngroupNeumeHandler(tornado.web.RequestHandler):

    def insert_puncta(self, nid, bboxes):
        '''
        Insert a punctum for each note in the reference neume
        before the reference neume in the MEI document.
        '''
        ref_neume = self.mei.getElementById(nid)
        parent = ref_neume.getParent()

        # get underlying notes
        notes = ref_neume.getDescendantsByName("note")
        nids = []
        for n, bb in zip(notes, bboxes):
            punctum = MeiElement("neume")
            punctum.addAttribute("name", "punctum")
            nc = MeiElement("nc")
            nc.addChild(n)
            punctum.addChild(nc)

            # add generated punctum id to return to client
            nids.append(punctum.getId())

            # add facs data for the punctum
            zone = self.get_new_zone(bb["ulx"], bb["uly"], bb["lrx"], bb["lry"])
            self.add_zone(punctum, zone)

            # insert the punctum before the reference neume
            parent.addChildBefore(ref_neume, punctum)

        return nids
    
    def delete_old_neume(self, nid):
        neume = self.mei.getElementById(str(nid))
        if neume:
            # remove facs data
            facs = neume.getAttribute("facs")
            if facs:
                facsid = facs.value
                # Remove the zone if it exists
                zone = self.mei.getElementById(str(facsid))
                if zone and zone.name == "zone":
                    zone.parent.removeChild(zone)

            # now remove the neume
            neume.parent.removeChild(neume)

    def get_new_zone(self, ulx, uly, lrx, lry):
        zone = MeiElement("zone")
        zone.addAttribute("ulx", str(ulx))
        zone.addAttribute("uly", str(uly))
        zone.addAttribute("lrx", str(lrx))
        zone.addAttribute("lry", str(lry))

        return zone

    def add_zone(self, neume, zone):
        # add zone to the surfaces
        surfaces = self.mei.getElementsByName("surface")
        if len(surfaces) and zone:
            surfaces[0].addChild(zone)

        if zone:
            # add facs id to neume
            neume.addAttribute("facs", zone.getId())

    def post(self, file):
        '''
        Ungroup a neume with the provided ID into puncta.
        Create bounding box information for each punctum.
        '''

        data = json.loads(self.get_argument("data", ""))

        nids = str(data["nids"]).split(",")
        bboxes = data["bbs"]

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        self.mei = XmlImport.read(fname)

        newids = []
        for nid, bb in zip(nids, bboxes):
            newids.append(self.insert_puncta(nid, bb))
            self.delete_old_neume(nid)

        XmlExport.write(self.mei, fname)

        result = {"nids": newids}
        self.write(json.dumps(result))

        self.set_status(200)

#####################################################
#              DIVISION HANDLER CLASSES             #
#####################################################
class InsertDivisionHandler(tornado.web.RequestHandler):

    def create_new_division(self, type):
        '''
        Make a new division and return the MEI element.
        Attach the facs data to the division element
        '''

        division = MeiElement("division")
        division.addAttribute("form", type)

        return division

    def insert_division(self, division, beforeid):
        before = self.mei.getElementById(beforeid)

        # get layer element
        layer_parent = before.getParent()

        if layer_parent and before:
            layer_parent.addChildBefore(before, division)

            if division.getAttribute("form").getValue() == "final":
                # if final division, close layer and staff
                self.move_elements(layer_parent, before)

    def create_zone(self, ulx, uly, lrx, lry):
        zone = MeiElement("zone")
        zone.addAttribute("ulx", ulx)
        zone.addAttribute("uly", uly)
        zone.addAttribute("lrx", lrx)
        zone.addAttribute("lry", lry)

        return zone

    def add_zone(self, division, zone):
        # add zone to the surfaces
        surfaces = self.mei.getElementsByName("surface")
        if len(surfaces) and zone:
            surfaces[0].addChild(zone)

        if zone:
            division.addAttribute("facs", zone.getId())

    def move_elements(self, layer, before):
        # get staff parent element
        staff = layer.getParent()
        section_parent = staff.getParent()

        # create new staff and layer
        new_staff = MeiElement("staff")
        new_layer = MeiElement("layer")
        new_layer.addAttribute("n", "1")
        
        # get elements after "before element" to move
        element_peers = before.getPeers()
        e_ind = list(element_peers).index(before)
        for e in element_peers[e_ind:]:
            # add element to the new staff/layer
            new_layer.addChild(e)
            # remove element from the current staff/layer
            layer.removeChild(e)

        new_staff.addChild(new_layer)

        # insert new staff into the document
        staves = section_parent.getChildrenByName("staff")
        s_ind = list(staves).index(staff)
        before_staff = None
        if s_ind+1 < len(staves):
            before_staff = staves[s_ind+1]

        # insert and update staff definitions
        self.insert_staff_def(s_ind+1, len(staves))

        # update staff numbers of subsequent staves
        for i, s in enumerate(staves[s_ind+1:]):
            s.addAttribute("n", str(s_ind+i+3))

        new_staff.addAttribute("n", str(s_ind+2))
        self.insert_staff(section_parent, new_staff, before_staff)
                
    def insert_staff(self, section, staff, before_staff):
        '''
        Insert the given staff before the another given staff.
        If there is no subsequent staff, just append to the staff
        to the end.
        '''

        if before_staff:
            section.addChildBefore(before_staff, staff)
        else:
            section.addChild(staff)

    def insert_staff_def(self, staff_num, num_staves):
        '''
        Insert a new staff definition with number staff_num
        and update subsequent staff definition numbers.
        '''

        staff_group = self.mei.getElementsByName("staffGrp")
        if len(staff_group):
            staff_defs = staff_group[0].getChildrenByName("staffDef")
            if len(staff_defs) == num_staves:
                for i, sd in enumerate(staff_defs[staff_num:]):
                    sd.addAttribute("n", str(staff_num+i+2))
                staff_def = MeiElement("staffDef")
                staff_def.addAttribute("n", str(staff_num+1))
                before_staff_def = None
                if staff_num < len(staff_defs):
                    before_staff_def = staff_defs[staff_num]

        if before_staff_def:
            staff_group[0].addChildBefore(before_staff_def, staff_def)
        else:
            staff_group[0].addChild(staff_def)

    def post(self, file):
        '''
        Insert a division before the given element. There is one case
        where there is no element to insert before, when there is no
        subsequent staff. In this case, the element is inserted at the end
        of the last system. Also sets the bounding box information of the new
        punctum.
        '''

        div_type = str(self.get_argument("type", ""))
        beforeid = str(self.get_argument("beforeid", None))

        # bounding box
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        self.mei = XmlImport.read(fname)

        zone = self.create_zone(ulx, uly, lrx, lry)
        division = self.create_new_division(div_type)
        self.add_zone(division, zone)
        self.insert_division(division, beforeid)

        XmlExport.write(self.mei, fname)

        result = {"id": division.getId()}
        self.write(json.dumps(result))
        self.set_status(200)

class MoveDivisionHandler(tornado.web.RequestHandler):

    def reposition_division(self, division, before_id):
        layer = division.getParent()

        final_division = False
        if division.getAttribute("form").getValue() == "final":
            final_division = True

        if final_division:
            # if final division, close layer and staff
            s_ind_old = self.move_elements_after_old_division(layer, division)

        # remove the division from the document
        layer.removeChild(division)
        
        before = self.mei.getElementById(before_id)
        # get layer element
        layer_before = before.getParent()

        if layer_before and before:
            layer_before.addChildBefore(before, division)

            if final_division:
                # if final division, close layer and staff
                s_ind_new = self.move_elements_after_new_division(layer_before, before)

    def move_elements_after_old_division(self, layer, division):
        staff = layer.getParent()
        section = staff.getParent()
        staves = section.getChildrenByName("staff")
        s_ind = list(staves).index(staff)

        if s_ind+1 < len(staves):
            next_staff = staves[s_ind+1]
            next_staff_layer = next_staff.getChildrenByName("layer")
            if len(next_staff_layer):
                # add elements from subsequent staff/layer to this staff/layer
                next_staff_elements = next_staff_layer[0].getChildren()

                # remove the next staff/layer from the MEI document
                section.removeChild(next_staff)

                for e in next_staff_elements:
                    layer.addChild(e)

        return s_ind

    def move_elements_after_new_division(self, layer, before):
        # get staff parent element
        staff = layer.getParent()
        section = staff.getParent()

        # create new staff and layer
        new_staff = MeiElement("staff")
        new_layer = MeiElement("layer")
        new_layer.addAttribute("n", "1")
        
        # get elements after "before element" to move
        element_peers = before.getPeers()
        e_ind = list(element_peers).index(before)
        for e in element_peers[e_ind:]:
            # add element to the new staff/layer
            new_layer.addChild(e)
            # remove element from the current staff/layer
            layer.removeChild(e)

        new_staff.addChild(new_layer)

        # insert new staff into the document
        staves = section.getChildrenByName("staff")
        s_ind = list(staves).index(staff)
        before_staff = None
        if s_ind+1 < len(staves):
            before_staff = staves[s_ind+1]

        # update staff numbers of subsequent staves
        for i, s in enumerate(staves[s_ind+1:]):
            s.addAttribute("n", str(s_ind+i+3))

        new_staff.addAttribute("n", str(s_ind+2))
        self.insert_staff(section, new_staff, before_staff)

        return s_ind

    def insert_staff(self, section, staff, before_staff):
        '''
        Insert the given staff before the another given staff.
        If there is no subsequent staff, just append to the staff
        to the end.
        '''

        if before_staff:
            section.addChildBefore(before_staff, staff)
        else:
            section.addChild(staff)

    def update_zone(self, division, ulx, uly, lrx, lry):
        facs_id = division.getAttribute("facs").getValue()
        if facs_id:
            zone = self.mei.getElementById(facs_id)
        else:
            zone = MeiElement("zone")
            division.addAttribute("facs", zone.getId())
            surfaces = self.mei.getElementsByName("surface")
            if len(surfaces):
                surfaces[0].addChild(zone)

        zone.addAttribute("ulx", ulx)
        zone.addAttribute("uly", uly)
        zone.addAttribute("lrx", lrx)
        zone.addAttribute("lry", lry)

    def post(self, file):
        '''
        Move a division before the given element. There is no
        element to insert before when there is no subsequent
        staff. In this case, the element is inserted at the end
        of the last system. Also sets the bounding box information
        of the new division placement.
        '''

        division_id = str(self.get_argument("id", ""))
        before_id = str(self.get_argument("beforeid", None))

        # bounding box
        ulx = str(self.get_argument("ulx", None))
        uly = str(self.get_argument("uly", None))
        lrx = str(self.get_argument("lrx", None))
        lry = str(self.get_argument("lry", None))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        self.mei = XmlImport.read(fname)

        division = self.mei.getElementById(division_id)
        self.update_zone(division, ulx, uly, lrx, lry)
        self.reposition_division(division, before_id)

        XmlExport.write(self.mei, fname)

        self.set_status(200)

class DeleteDivisionHandler(tornado.web.RequestHandler):

    def move_elements(self, division):
        layer = division.getParent()
        staff = layer.getParent()
        section = staff.getParent()

        staves = section.getChildrenByName("staff")
        s_ind = list(staves).index(staff)

        # get elements from next staff/layer, if any
        # and move them to the previous staff/layer
        next_layer = staves[s_ind+1].getChildrenByName("layer")
        if len(next_layer):
            elements = next_layer[0].getChildren()

            # add these elements to the previous staff/layer
            for e in elements:
                layer.addChild(e)

            # remove the staffDef for the removed layer
            staff_group = self.mei.getElementsByName("staffGrp")
            if len(staff_group):
                staff_defs = staff_group[0].getChildrenByName("staffDef")
                if len(staff_defs) == len(staves):
                    # renumber subsequent staff defs
                    for i, sd in enumerate(staff_defs[s_ind+2:]):
                        sd.addAttribute("n", str(s_ind+i+2))

                    staff_group[0].removeChild(staff_defs[s_ind+1])

            # renumber subsequent staves
            for i, s in enumerate(staves[s_ind+2:]):
                s.addAttribute("n", str(s_ind+i+2))

            # remove the next staff/layer
            section.removeChild(staves[s_ind+1])

    def delete_division(self, division):
        '''
        Remove the given division from the MEI document
        '''

        # first remove zone if it exists
        facs_id = division.getAttribute("facs").getValue()
        zone = self.mei.getElementById(facs_id)
        if zone:
            zone.getParent().removeChild(zone)

        if division.getAttribute("form").getValue() == "final":
            self.move_elements(division)

        # delete the division
        division.getParent().removeChild(division)

    def post(self, file):
        '''
        Delete a division from the MEI document. Special
        consideration is taken when deleting divisions of form
        "final"
        '''

        division_ids = str(self.get_argument("ids", ""))

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        self.mei = XmlImport.read(fname)
        
        for id in division_ids.split(","):
            division = self.mei.getElementById(id)
            self.delete_division(division)

        XmlExport.write(self.mei, fname)

        self.set_status(200)
