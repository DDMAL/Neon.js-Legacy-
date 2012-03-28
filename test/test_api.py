#!/usr/bin/python
import os
import sys
import unittest

import pymei
import tornado.web
import tornado.httpserver

from tornado.testing import AsyncHTTPTestCase

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from neonsrv import api

class FakeReq():
    """ A class that looks enough like an HTTPRequest to create a
    RequestHandler object. """
    headers = {}
    def supports_http_1_1(self):
        pass

class DeleteNoteTest(unittest.TestCase):

    def setUp(self):
        app = tornado.web.Application()
        req = FakeReq()
        path = os.path.join(os.path.dirname(__file__), "data", "0400_segment.mei")
        self.mei = pymei.XmlImport.documentFromFile(path)
        self.deleter = api.DeleteNoteHandler(app, req)
        self.deleter.mei = self.mei

    def testDeleteNote(self):
        """ Delete a note but leave other stuff in the nc """
        note = self.mei.getElementById("m-c33fda11-014e-4028-8c6d-d5b9bc927839")
        self.deleter.delete_note(note)
        self.assertEqual(None, self.mei.getElementById("m-c33fda11-014e-4028-8c6d-d5b9bc927839"))
        self.assertEqual(2, len(self.mei.getElementById("m-d60836bd-c4e9-47c9-bac8-c3cf1af87847").children))

    def testDeleteNoteAndSurroundingNc(self):
        """ Delete a note and its nc, but leave the neume because
        there's another nc """
        note = self.mei.getElementById("m-id3")
        self.deleter.delete_note(note)
        self.assertEqual(None, self.mei.getElementById("m-id2"))
        self.assertEqual(1, len(self.mei.getElementById("m-id1").children))
        self.assertEqual("nc", self.mei.getElementById("m-id6").name)

    def testDeleteNoteNcAndNeume(self):
        """ Delete the note, its nc, and its neume. Also remove the
        neume's zone """
        note = self.mei.getElementById("m-82af3519-e4a5-4992-a54d-4217759ff272")
        self.assertEqual("zone", self.mei.getElementById("m-df35aa9a-9155-4c89-a8b2-a05688156807").name)
        self.assertEqual(5, len(self.mei.getElementById("m-54a0bb9f-7aee-4417-bbe7-298e9149a8a2").children))
        self.deleter.delete_note(note)
        # neume should be gone
        self.assertEqual(None, self.mei.getElementById("m-afb0de04-7df2-4abd-b0af-6b03e91b5fe8"))
        self.assertEqual(4, len(self.mei.getElementById("m-54a0bb9f-7aee-4417-bbe7-298e9149a8a2").children))
        # Zone should be gone
        self.assertEqual(None, self.mei.getElementById("m-df35aa9a-9155-4c89-a8b2-a05688156807"))

    def testDeleteNeumeAndZone(self):
        """ Delete an id that is a neume, and remove its zone """
        neume = self.mei.getElementById("m-a4b60c3b-58ce-4918-8b97-38c960c50dab")
        self.deleter.delete_neume(neume)
        # Neume
        self.assertEqual(None, self.mei.getElementById("m-a4b60c3b-58ce-4918-8b97-38c960c50dab"))
        # Zone
        self.assertEqual(None, self.mei.getElementById("m-b06676a3-4aa1-430d-b1c8-3d3fcf606f0e"))

    def testDoDeleteNote(self):
        """ test do_delete with an id of a note """
        self.deleter.do_delete("m-c33fda11-014e-4028-8c6d-d5b9bc927839")
        self.assertEqual(2, len(self.mei.getElementById("m-d60836bd-c4e9-47c9-bac8-c3cf1af87847").children))

    def testDoDeleteNeume(self):
        """ test do_delete with an id of a neume """
        self.deleter.do_delete("m-afb0de04-7df2-4abd-b0af-6b03e91b5fe8")
        self.assertEqual(None, self.mei.getElementById("m-afb0de04-7df2-4abd-b0af-6b03e91b5fe8"))

    def testDeleteMultipleNotes(self):
        """ Delete multiple notes by passing in a list of ids """
        self.deleter.do_delete("m-c33fda11-014e-4028-8c6d-d5b9bc927839,m-9569862a-2076-43e3-8926-d0da646a3ae0")
        self.assertEqual(1, len(self.mei.getElementById("m-d60836bd-c4e9-47c9-bac8-c3cf1af87847").children))



class ChangeNoteTest(unittest.TestCase):

    def setUp(self):
        app = tornado.web.Application()
        req = FakeReq()
        path = os.path.join(os.path.dirname(__file__), "data", "0400_segment.mei")
        self.mei = pymei.XmlImport.read(path)
        self.changer = api.ChangeNeumePitchHandler(app, req)
        self.changer.mei = self.mei

    def testUpdateZone(self):
        """foo"""
        neume = self.mei.getElementById("m-a4b60c3b-58ce-4918-8b97-38c960c50dab")
        self.changer.update_or_add_zone(neume, "1", "2", "3", "4")

        zone = self.mei.getElementById("m-b06676a3-4aa1-430d-b1c8-3d3fcf606f0e")
        self.assertEqual("1", zone.getAttribute("ulx").value)
        self.assertEqual("2", zone.getAttribute("uly").value)
        self.assertEqual("3", zone.getAttribute("lrx").value)
        self.assertEqual("4", zone.getAttribute("lry").value)

    def testPitchDifference(self):
        self.assertEqual(1, self.changer.find_difference("c", "4", "d", "4"))
        self.assertEqual(-1, self.changer.find_difference("e", "4", "d", "4"))

        self.assertEqual(3, self.changer.find_difference("f", "4", "b", "5"))
        self.assertEqual(9, self.changer.find_difference("d", "4", "f", "5"))
        self.assertEqual(7, self.changer.find_difference("e", "3", "e", "4"))
        self.assertEqual(5, self.changer.find_difference("d", "3", "b", "4"))
        self.assertEqual(-5, self.changer.find_difference("b", "4", "d", "3"))
        self.assertEqual(-11, self.changer.find_difference("e", "4", "a", "3"))

    def testNewNote(self):
        self.assertEqual( ("c", "4"), self.changer.new_note("a", "4", 2))
        self.assertEqual( ("d", "4"), self.changer.new_note("e", "4", -1))
        self.assertEqual( ("b", "5"), self.changer.new_note("f", "4", 3))
        self.assertEqual( ("f", "5"), self.changer.new_note("d", "4", 9))
        self.assertEqual( ("e", "4"), self.changer.new_note("e", "3", 7))
        self.assertEqual( ("b", "4"), self.changer.new_note("d", "3", 5))
        self.assertEqual( ("d", "3"), self.changer.new_note("b", "4", -5))
        self.assertEqual( ("a", "3"), self.changer.new_note("e", "4", -11))

    def testMoveNeume(self):
        neume = self.mei.getElementById("m-a4b60c3b-58ce-4918-8b97-38c960c50dab")
        self.changer.move_neume(neume, "g", "3")

        n1 = self.mei.getElementById("m-c33fda11-014e-4028-8c6d-d5b9bc927839")
        n2 = self.mei.getElementById("m-9569862a-2076-43e3-8926-d0da646a3ae0")
        n3 = self.mei.getElementById("m-962da020-362b-416f-bbcc-3c1f72de5798")

        self.assertEqual("g", n1.getAttribute("pname").value)
        self.assertEqual("3", n1.getAttribute("oct").value)
        self.assertEqual("f", n2.getAttribute("pname").value)
        self.assertEqual("4", n2.getAttribute("oct").value)
        self.assertEqual("g", n3.getAttribute("pname").value)
        self.assertEqual("3", n3.getAttribute("oct").value)

class InsertNoteTest(unittest.TestCase):

    def setUp(self):
        app = tornado.web.Application()
        req = FakeReq()
        path = os.path.join(os.path.dirname(__file__), "data", "0400_segment.mei")
        self.mei = pymei.XmlImport.read(path)
        self.inserter = api.InsertNeumeHandler(app, req)
        self.inserter.mei = self.mei

    def testGetNeumeXml(self):
        r = self.inserter.get_new_neume("c", "4")
        self.assertEqual("neume", r.name)
        self.assertEqual("punctum", r.getAttribute("name").value)
        self.assertEqual("nc", r.children[0].name)
        self.assertEqual("note", r.children[0].children[0].name)
        note = r.children[0].children[0]
        self.assertEqual("c", note.getAttribute("pname").value)
        self.assertEqual("4", note.getAttribute("oct").value)

    def testGetZoneXml(self):
        z = self.inserter.get_new_zone("1", "2", "3", "4");

        self.assertEqual("zone", z.name)
        self.assertEqual("1", z.getAttribute("ulx").value)
        self.assertEqual("2", z.getAttribute("uly").value)
        self.assertEqual("3", z.getAttribute("lrx").value)
        self.assertEqual("4", z.getAttribute("lry").value)

    def testDoInsertBefore(self):
        newneume = self.inserter.get_new_neume("c", "4")
        newzone = self.inserter.get_new_zone("1", "2", "3", "4")

        layerId = "m-54a0bb9f-7aee-4417-bbe7-298e9149a8a2"
        before = "m-a4b60c3b-58ce-4918-8b97-38c960c50dab"
        self.inserter.do_insert(newneume, newzone, layerId, before)

        surface = self.mei.getElementById("m-4954b1c5-9c05-4963-accb-b6e351e3b6b4")
        self.assertEqual(6, len(surface.children))
        self.assertEqual(newzone.id, surface.children[-1].id)

        layer = self.mei.getElementById(layerId)
        self.assertEqual(6, len(layer.children))
        self.assertEqual(newneume.id, layer.children[3].id)

    def testDoInsertEnd(self):
        newneume = self.inserter.get_new_neume("c", "4")
        newzone = self.inserter.get_new_zone("1", "2", "3", "4")

        layerId = "m-54a0bb9f-7aee-4417-bbe7-298e9149a8a2"
        self.inserter.do_insert(newneume, newzone, layerId)

        surface = self.mei.getElementById("m-4954b1c5-9c05-4963-accb-b6e351e3b6b4")
        self.assertEqual(6, len(surface.children))
        self.assertEqual(newzone.id, surface.children[-1].id)

        layer = self.mei.getElementById(layerId)
        self.assertEqual(6, len(layer.children))
        self.assertEqual(newneume.id, layer.children[-1].id)

    def testDoInsertNoZone(self):
        newneume = self.inserter.get_new_neume("c", "4")

        layerId = "m-54a0bb9f-7aee-4417-bbe7-298e9149a8a2"
        self.inserter.do_insert(newneume, None, layerId, None)

        surface = self.mei.getElementById("m-4954b1c5-9c05-4963-accb-b6e351e3b6b4")
        self.assertEqual(5, len(surface.children))

        layer = self.mei.getElementById(layerId)
        self.assertEqual(6, len(layer.children))
        self.assertEqual(newneume.id, layer.children[-1].id)

