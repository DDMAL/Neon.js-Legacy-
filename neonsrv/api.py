import os

from pymei import XmlImport
from pymei import XmlExport
from pymei import MeiElement
import tornado.web
import json

import conf

class DeleteNoteHandler(tornado.web.RequestHandler):
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

    pitches = ["a", "b", "c", "d", "e", "f", "g"]

    def find_difference(self, pname, octave, newpname, newoct):
        """ Find the distance between two pictch/octave pairs.
        Opposite of new_note. """

        pname = pname.lower()
        newpname = newpname.lower()
        if isinstance(octave, basestring):
            octave = int(octave)
        if isinstance(newoct, basestring):
            newoct = int(newoct)
        oldidx = self.pitches.index(pname)
        newidx = self.pitches.index(newpname)

        difference = (newidx - oldidx) + (7 * (newoct - octave))
        return difference

    def new_note(self, pname, octave, difference):
        """ If you have a pitch and octave and a direction
        to move it in, give a new pitch and octave -
        opposite of find_difference.

        Returns a tuple (pname, oct) """

        if isinstance(octave, basestring):
            octave = int(octave)
        pname = pname.lower()

        oldidx = self.pitches.index(pname)

        newidx = (oldidx + difference) % 7
        octavech = (oldidx + difference) / 7
        octave += octavech
        return (self.pitches[newidx], "{}".format(octave))

    def move_neume(self, neume, newp, newo):
        """ Change the pitch of a neume """
        if neume:
            notes = neume.getDescendantsByName("note")
            if len(notes):
                first = notes[0]
                o = first.getAttribute("oct").value
                p = first.getAttribute("pname").value
                difference = self.find_difference(p, o, newp, newo)
                for n in notes:
                    noteoct = n.getAttribute("oct").value
                    notep = n.getAttribute("pname").value
                    (changep, changeo) = self.new_note(notep, noteoct, difference)
                    n.addAttribute("oct", changeo)
                    n.addAttribute("pname", changep)

    def update_or_add_zone(self, neume, ulx, uly, lrx, lry):
        if neume:
            facsid = neume.getAttribute("facs").value
            if facsid:
                zone = self.mei.getElementById(facsid)
                if zone:
                    zone.addAttribute("ulx", ulx)
                    zone.addAttribute("uly", uly)
                    zone.addAttribute("lrx", lrx)
                    zone.addAttribute("lry", lry)

    def post(self, file):
        """ Change the pitch of a <neume> element.
        Pass in an argument called 'id' which is the id of a <neume>
        object. arguments pname and oct refer to the new pitch and
        octave of the first note in the neume. All other notes in the
        neume will have their relative pitches updated.

        if arguments lrx,lry,ulx,uly are provided, then an associated
        <zone> element will have its coordinates updated. If there is
        no <zone> element then nothing will be added.
        """

        neumeid = self.get_argument("id", "")
        pname = self.get_argument("pname", "")
        octave = self.get_argument("octave", "")

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        self.mei = XmlImport.documentFromFile(fname)

        neume = self.mei.get_by_id(neumeid)

        self.move_neume(neume, pname, octave)

        # Bounding box
        lrx = self.get_argument("lrx", None)
        lry = self.get_argument("lry", None)
        ulx = self.get_argument("ulx", None)
        uly = self.get_argument("uly", None)

        if lrx and lry and ulx and uly:
            update_or_add_zone(neume, ulx, uly, lrx, lry)

        XmlExport.write(self.mei, fname)
        self.set_status(200)

class InsertNeumeHandler(tornado.web.RequestHandler):

    def do_insert(self, neume, zone, parentId, before=None):
        """ Insert into the mei contents """
        if zone:
            neume.addAttribute("facs", zone.getId())

        parent = self.mei.getElementById(parentId)
        if parent and before:
            before = self.mei.getElementById(before)
            parent.addChildBefore(before, neume)
        elif parent:
            parent.addChild(neume)

        surfaces = self.mei.getElementsByName("surface")
        if len(surfaces) and zone:
            surfaces[0].addChild(zone)
            return surfaces[0].id
        else:
            return None

    def get_new_neume(self, pname, octave):
        """ Make a new note and return MEI object """
        neume = MeiElement("neume")
        neume.addAttribute("name", "punctum")
        nc = MeiElement("nc")
        note = MeiElement("note")
        note.addAttribute("pname", pname)
        note.addAttribute("oct", octave)
        neume.addChild(nc)
        nc.addChild(note)

        return neume

    def get_new_zone(self, ulx, uly, lrx, lry):
        zone = MeiElement("zone")
        zone.addAttribute("ulx", ulx)
        zone.addAttribute("uly", uly)
        zone.addAttribute("lrx", lrx)
        zone.addAttribute("lry", lry)

        return zone

    def post(self, file):
        """ Insert a new neume with a single note.
        Returns the xml for the note, and the zone information.
        Set the neume as a child of `parent'. If `before' is set, it is
        expected to be a child of the parent and the new neume is 
        inserted before the element with the id specified by before.
        If `before' is not set, the new neume is added to the end of
        `parent's children list.
        Pass in ulx,uly,lrx,lry for bounding boxes if wanted.

        A json dictionary is returned:
          {"neume": <neume>...,
           "zone": <zone>...,
           "zoneparent": m-nnnn-..."
          }
        where neume and zone are xml of the elements, and zoneparent
        is the id of the element that the zone should be added
        to the end of.
        """
        before = self.get_argument("before", None)
        parent = self.get_argument("parent", None)
        pname = self.get_argument("pname", "")
        octave = self.get_argument("octave", "")

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        self.mei = XmlImport.documentFromFile(fname)

        neume = get_new_neume(pname, octave)
        neume_xml = XmlExport.meiElementToText(neume)

        # Bounding box
        lrx = self.get_argument("lrx", None)
        lry = self.get_argument("lry", None)
        ulx = self.get_argument("ulx", None)
        uly = self.get_argument("uly", None)

        if lrx and lry and ulx and uly:
            zone = self.get_new_zone(ulx, uly, lrx, lry)
            zone_xml = XmlExport.meiElementToText(zone)
        else:
            zone = None
            zone_xml = ""

        surface_id = self.do_insert(neume, zone, parent, before)

        XmlExport.write(self.mei, fname)

        result = {"zone": zone_xml,
                "neume": neume_xml,
                "zoneparent": surface_id
                }
        self.write(json.dumps(result))
        self.set_status(200)
