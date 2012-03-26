import os

from pymei import XmlImport
from pymei import XmlExport
import tornado.web

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

