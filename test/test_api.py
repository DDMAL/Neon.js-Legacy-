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

