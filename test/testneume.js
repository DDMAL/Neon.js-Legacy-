(function() {
    module("Neume");

    // staff bounding box
    // <zone lry="406" lrx="1450" xml:id="m-0ac66c2a-bebd-493a-94bc-cfa2a0ba0489" uly="302" ulx="190"/>
    var sbb = [190,302,1450,406];

    // neume bounding box
    // <zone lry="376" lrx="315" xml:id="m-b06676a3-4aa1-430d-b1c8-3d3fcf606f0e" uly="326" ulx="265"/>
    var nbb = [265,326,315,376];

    test("Constructor", function() {
        // test default constructor properties
        var nModel = new Toe.Model.Neume();
    
        equal(nModel.props.key, "punctum");
        deepEqual(nModel.props.type, Toe.Model.Neume.Type.punctum);
        equal(nModel.props.rootNote.pitch, "c");
        equal(nModel.props.rootNote.octave, 3);
        ok(!nModel.props.modifier);
        ok(nModel.props.interact);

        // test constructor with specified neume properties
        nModel = new Toe.Model.Neume({key: "torculus", rootNote: {pitch: "f", octave: 4}, interact: false});

        equal(nModel.props.key, "torculus");
        deepEqual(nModel.props.type, Toe.Model.Neume.Type.torculus);
        equal(nModel.props.rootNote.pitch, "f");
        equal(nModel.props.rootNote.octave, 4);
        ok(!nModel.props.modifier);
        ok(!nModel.props.interact);

        // test creation of unknown neume 
        // these are called compound neumes in the model
        nModel = new Toe.Model.Neume({key: "myNeume"});

        equal(nModel.props.key, "compound");
        deepEqual(nModel.props.type, Toe.Model.Neume.Type.compound);
    });

    test("Set Bounding Box", function() {
        var nModel = new Toe.Model.Neume();

        // test invalid bounding box argument
        raises(function() { 
            nModel.setBoundingBox([234,23,0,0]);
        });

        nModel.setBoundingBox(nbb);
        equal(nModel.zone.ulx, nbb[0]);
        equal(nModel.zone.uly, nbb[1]);
        equal(nModel.zone.lrx, nbb[2]);
        equal(nModel.zone.lry, nbb[3]);
    });

    test("Set Root Note", function() {
        var nModel = new Toe.Model.Neume();

        nModel.setRootNote("g", 3);

        equal(nModel.props.rootNote.pitch, "g");
        equal(nModel.props.rootNote.octave, 3);
    });

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

            nModel.setRootNote(Toe.neumaticChroma[iChroma], iOct);
            nModel.calcRootDifference(sModel);
            equal(nModel.rootDiff, startDiff);
            startDiff++;
        }

        /*
        // test below
        nModel.setRootNote("a", 3);
        nModel.calcRootDifference(sModel);
        equal(nModel.rootDiff, -2);
        nModel.setRootNote("b", 2);
        nModel.calcRootDifference(sModel);
        equal(nModel.rootDiff, -8);

        // test above
        nModel.setRootNote("f", 4);
        nModel.calcRootDifference(sModel);
        equal(nModel.rootDiff, 3);
        nModel.setRootNote("e", 5);
        nModel.calcRootDifference(sModel);
        equal(nModel.rootDiff, 9);

        // test same
        nModel.setRootNote("c", 4);
        nModel.calcRootDifference(sModel);
        equal(nModel.rootDiff, 0);
        */

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

            nModel.setRootNote(Toe.neumaticChroma[iChroma], iOct);
            nModel.calcRootDifference(sModel);
            equal(nModel.rootDiff, startDiff);
            startDiff++;
        }

        /*
        // test below
        nModel.setRootNote("b", 3);
        nModel.calcRootDifference(sModel);
        equal(nModel.rootDiff, -4);
        nModel.setRootNote("e", 2);
        nModel.calcRootDifference(sModel);
        equal(nModel.rootDiff, -8);

        // test above
        nModel.setRootNote("a", 4);
        nModel.calcRootDifference(sModel);
        equal(nModel.rootDiff, 2);
        nModel.setRootNote("b", 5);
        nModel.calcRootDifference(sModel);
        equal(nModel.rootDiff, 10);

        // test same
        nModel.setRootNote("f", 4);
        nModel.calcRootDifference(sModel);
        equal(nModel.rootDiff, 0);
        */
    });

    test("Calculate Pitch Difference", function() {
        var nModel = new Toe.Model.Neume();

        nModel.setRootNote("a", 3);

        equal(nModel.getPitchDifference("g", 3), -1);

        nModel.setRootNote("c", 4);

        equal(nModel.getPitchDifference("c", 4), 0);
        equal(nModel.getPitchDifference("f", 4), 3);
        equal(nModel.getPitchDifference("a", 5), 12);
        equal(nModel.getPitchDifference("a", 3), -2);
        equal(nModel.getPitchDifference("d", 2), -13);

        nModel.setRootNote("f", 4);

        equal(nModel.getPitchDifference("f", 4), 0);
        equal(nModel.getPitchDifference("b", 4), -4);
        equal(nModel.getPitchDifference("a", 5), 9);
        equal(nModel.getPitchDifference("e", 3), -1);
        equal(nModel.getPitchDifference("d", 2), -9);

        nModel.setRootNote("d", 2);

        equal(nModel.getPitchDifference("d", 2), 0);
        equal(nModel.getPitchDifference("g", 2), 3);
        equal(nModel.getPitchDifference("f", 3), 9);
        equal(nModel.getPitchDifference("b", 2), -2);
        equal(nModel.getPitchDifference("c", 1), -1);
    });
})();
