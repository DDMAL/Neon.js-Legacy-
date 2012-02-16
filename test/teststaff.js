(function() {
    module("Staff");

    var bb = [0,0,100,100];

    test("Constructor", function() {
        // test invalid bounding box argument
        raises(function() { 
            new Toe.Model.Staff([100,100,0,0]);
        });

        var sModel = new Toe.Model.Staff(bb);

        equal(sModel.zone.ulx, bb[0]);
        equal(sModel.zone.uly, bb[1]);
        equal(sModel.zone.lrx, bb[2]);
        equal(sModel.zone.lry, bb[3]);

        // test default properties
        equal(sModel.props.numLines, 4);
        ok(!sModel.props.interact);
    });

    test("Set Bounding Box", function() {
        var sModel = new Toe.Model.Staff([2,2,200,200]);

        // test invalid bounding box argument
        raises(function() { 
            sModel.setBoundingBox([234,23,0,0]);
        });

        sModel.setBoundingBox(bb);
        equal(sModel.zone.ulx, bb[0]);
        equal(sModel.zone.uly, bb[1]);
        equal(sModel.zone.lrx, bb[2]);
        equal(sModel.zone.lry, bb[3]);
    });

    test("Set Clef", function() {
        var sModel = new Toe.Model.Staff(bb);
        var cModel = new Toe.Model.Clef("c");

        sModel.setClef(cModel);

        equal(sModel.clef, cModel);

        // check clef position has been set appropriately: no bb
        equal(cModel.x, sModel.zone.ulx);
        equal(cModel.y, sModel.zone.uly+((sModel.props.numLines-cModel.props.staffLine)*sModel.delta_y));

        cModel.setBoundingBox([bb[0]+5, bb[1], bb[2], bb[3]]);
        sModel.setClef(cModel);

        // check clef position has been set appropriately: with bb
        equal(cModel.x, cModel.zone.ulx);
        equal(cModel.y, sModel.zone.uly+((sModel.props.numLines-cModel.props.staffLine)*sModel.delta_y));
    });

    test("Add Neume", function() {
        var numNeumes = 2;
        var sModel = new Toe.Model.Staff(bb);
        var cModel = new Toe.Model.Clef("c");
        sModel.setClef(cModel);

        for (var i = 0; i < numNeumes; i++) { 
            var nModel = new Toe.Model.Neume();
            sModel.addNeume(nModel);
        }

        equal(sModel.neumes.length, numNeumes);
    });
})();
