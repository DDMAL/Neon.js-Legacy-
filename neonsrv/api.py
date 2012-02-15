import os

import pymei.Import.xmltomei
import pymei.Export.meitoxml
import tornado.web

import conf

class DeleteNoteHandler(tornado.web.RequestHandler):
    def post(self, file):
        """ Delete one or more <note> elements.
        Pass in an argument called 'id' with a comma separated list of
        ids of note elements to delete.
        If the note's surrounding <nc> element is empty after this, remove it.
        If the nc's surrounding <neume> element is empty, remove it.
        Remove any <zone> elements whose ids are referenced by removed <neume>s.
        Does not reduce the size of the bounding box on a <zone>.
        """
        todelete = self.get_argument("id", "")

        mei_directory = os.path.abspath(conf.MEI_DIRECTORY)
        fname = os.path.join(mei_directory, file)
        mei = pymei.Import.xmltomei.xmltomei(fname)
        for i in todelete.split(","):
            note = mei.get_by_id(i)
            if note and note.name == "note":
                nc = note.parent
                if nc and nc.name == "nc":
                    neume = nc.parent
                    if neume and neume.name == "neume":
                        # If we have neume -> nc -> note, remove the note.
                        nc.remove_child(note)
                        # Remove the nc and neume if they're empty
                        if len(nc.children) == 0:
                            neume.remove_child(nc)
                        if len(neume.children) == 0:
                            neume.parent.remove_child(neume)
                        # Remove the zone if it exists
                        facsid = neume.attribute_by_name("facs").value
                        zone = mei.get_by_id(facsid)
                        if zone and zone.name == "zone":
                            zone.parent.remove_child(zone)
        pymei.Export.meitoxml.meitoxml(mei, fname)

        self.set_status(200)

