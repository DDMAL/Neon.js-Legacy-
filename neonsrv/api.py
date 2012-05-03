import os

from pymei import XmlImport
from pymei import XmlExport
from pymei import MeiElement
import tornado.web
import json

import conf

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
        todelete = self.get_argument("id", "")

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)

        fname = os.path.join(mei_directory, file)
        self.mei = XmlImport.read(fname)
        self.do_delete(todelete)

        XmlExport.write(self.mei, fname)

        self.set_status(200)

class ChangeNeumePitchHandler(tornado.web.RequestHandler):

    def neume_pitch_shift(self, neume, pitchInfo):
        notes = neume.getDescendantsByName("note")
        if len(notes):
            for n, pinfo in zip(notes, pitchInfo):
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
        pitchInfo = data["pitchInfo"]

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        self.mei = XmlImport.read(fname)

        neume = self.mei.getElementById(nid)

        if pitchInfo is not None:
            self.neume_pitch_shift(neume, pitchInfo)

        self.reposition_neume(neume, beforeid)
        self.update_or_add_zone(neume, bb)

        XmlExport.write(self.mei, fname)

        self.set_status(200)

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
        print "beforeID: ", beforeId
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

        nid = str(data["nid"])
        bboxes = data["bb"]

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        self.mei = XmlImport.read(fname)

        nids = self.insert_puncta(nid, bboxes)
        self.delete_old_neume(nid)

        XmlExport.write(self.mei, fname)

        result = {"nids": nids}
        self.write(json.dumps(result))
        self.set_status(200)
