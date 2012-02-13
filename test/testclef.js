(function() {
    module("Clef");

    // <zone lry="331" lrx="208" xml:id="m-5ff17ad0-6396-4f4b-9c99-de55e140ee97" uly="278" ulx="190"/>
    var bb = [190,278,208,331];

    test("Constructor", function() {
        var cClefModel = new Toe.Model.Clef("c");
        var fClefModel = new Toe.Model.Clef("f");

        equal(cClefModel.shape, "c");
        equal(cClefModel.name, "Doh Clef");
        equal(fClefModel.shape, "f");
        equal(fClefModel.name, "Fah Clef");

        // check default staff line has been set correctly
        equal(cClefModel.props.staffLine, 4);
        equal(fClefModel.props.staffLine, 3);

        // test default properties
        ok(!cClefModel.props.interact);
    });

    test("Set Bounding Box", function() {
        var cClefModel = new Toe.Model.Clef("c");

        // test invalid bounding box argument
        raises(function() { 
            cClefModel.setBoundingBox([-100,0,-200,0]);
        });

        cClefModel.setBoundingBox(bb);

        equal(cClefModel.zone.ulx, bb[0]);
        equal(cClefModel.zone.uly, bb[1]);
        equal(cClefModel.zone.lrx, bb[2]);
        equal(cClefModel.zone.lry, bb[3]);

    });
    
    test("Set Position", function() {
        var cClefModel = new Toe.Model.Clef("c");

        cClefModel.setPosition([bb[0], bb[1]]);

        equal(cClefModel.x, bb[0]);
        equal(cClefModel.y, bb[1]);
    });
})();
