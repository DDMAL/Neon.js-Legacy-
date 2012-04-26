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
            nModel.addComponent("punctum", "c", 4);
            sModel.addNeume(nModel);
        }

        equal(sModel.elements.length, numNeumes);
    });

    /* This has been moved from neume, works but needs slight tweaking.
        test("Calculate Root Note Difference", function() {
        var sModel = new Toe.Model.Staff(sbb);
        var nModel = new Toe.Model.Neume();

        // C CLEF: test notes above and below the clef
        // differences should be the same regardless of clef staffline
        var cModel = new Toe.Model.Clef("c", {staffLine: 4});
        sModel.setClef(cModel);

        var numChroma = Toe.neumaticChroma.length;
        var iOct = 0;
        var octRange = 8;
        var startDiff = -23;
        for (var iChroma = 0; iOct <= octRange; iChroma++) {
            iChroma %= numChroma;
            if (Toe.neumaticChroma[iChroma] == "c") {
                iOct++;
            }

            nModel.setRootNote(Toe.neumaticChroma[iChroma], iOct, {staff: sModel});
            equal(nModel.rootDiff, startDiff);
            startDiff++;
        }

        // F CLEF: test notes above and below the clef
        cModel = new Toe.Model.Clef("f", {staffLine: 3});
        sModel.setClef(cModel);

        var numChroma = Toe.neumaticChroma.length;
        var iOct = 0;
        var octRange = 8;
        var startDiff = -26;
        for (var iChroma = 0; iOct <= octRange; iChroma++) {
            iChroma %= numChroma;
            if (Toe.neumaticChroma[iChroma] == "f") {
                iOct++;
            }

            nModel.setRootNote(Toe.neumaticChroma[iChroma], iOct, {staff: sModel});
            equal(nModel.rootDiff, startDiff);
            startDiff++;
        }
    });

    test("Calculate Pitch Difference", function() {
        var nModel = new Toe.Model.Neume();
        var sModel = new Toe.Model.Staff(sbb);
        var cModel = new Toe.Model.Clef("c");
        sModel.setClef(cModel);

        nModel.setRootNote("a", 3, {staff: sModel});

        equal(nModel.calcComponentDifference(sModel, "g", 3), -1);

        nModel.setRootNote("c", 4, {staff: sModel});

        equal(nModel.calcComponentDifference(sModel, "c", 4), 0);
        equal(nModel.calcComponentDifference(sModel, "f", 4), 3);
        equal(nModel.calcComponentDifference(sModel, "a", 5), 12);
        equal(nModel.calcComponentDifference(sModel, "a", 3), -2);
        equal(nModel.calcComponentDifference(sModel, "d", 2), -13);

        nModel.setRootNote("f", 4, {staff: sModel});

        equal(nModel.calcComponentDifference(sModel, "f", 4), 0);
        equal(nModel.calcComponentDifference(sModel, "b", 4), 3);
        equal(nModel.calcComponentDifference(sModel, "a", 5), 9);
        equal(nModel.calcComponentDifference(sModel, "e", 3), -8);
        equal(nModel.calcComponentDifference(sModel, "d", 2), -16);

        nModel.setRootNote("d", 2, {staff: sModel});

        equal(nModel.calcComponentDifference(sModel, "d", 2), 0);
        equal(nModel.calcComponentDifference(sModel, "g", 2), 3);
        equal(nModel.calcComponentDifference(sModel, "f", 3), 9);
        equal(nModel.calcComponentDifference(sModel, "b", 2), 5);
        equal(nModel.calcComponentDifference(sModel, "c", 1), -8);
    });
    */
})();
