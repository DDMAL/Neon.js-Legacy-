(function() {
    module("Neume");

    var testMeiPath = 'test/data/allneumes.mei';

    // <zone lry="331" lrx="208" xml:id="m-5ff17ad0-6396-4f4b-9c99-de55e140ee97" uly="278" ulx="190"/>
    var clef_bb = [190, 278, 208, 331];
    // <zone xml:id="m-0ac66c2a-bebd-493a-94bc-cfa2a0ba0489" lry="406" lrx="1450" uly="302" ulx="190"/>
    var staff_bb = [190, 302, 406, 1450];
    // <zone lry="349" lrx="258" xml:id="m-df35aa9a-9155-4c89-a8b2-a05688156807" uly="328" ulx="240"/>
    var neume1_bb = [240, 328, 258, 349];
    // <zone lry="376" lrx="315" xml:id="m-b06676a3-4aa1-430d-b1c8-3d3fcf606f0e" uly="326" ulx="265"/>
    var neume2_bb = [265, 326, 315, 376];

    test("Constructor", function() {
        // test default constructor properties
        var nModel = new Toe.Model.Neume();
        
        deepEqual(nModel.zone, new Object());
        equal(nModel.props.modifier, null);
        ok(nModel.props.interact);
        equal(nModel.name, null);
        equal(nModel.typeid, null);
        equal(nModel.neumePrefix, null);
        equal(nModel.rootStaffPos, null);
        equal(nModel.id, null);
        equal(nModel.staff, null);
        deepEqual(nModel.components, new Array());

        nModel = new Toe.Model.Neume({interact: false, modifier: "alt"});
        ok(!nModel.props.interact);
        equal(nModel.props.modifier, "liquescence");
    });

    test("Set Bounding Box", function() {
        var nModel = new Toe.Model.Neume();

        // test invalid bounding box argument
        raises(function() { 
            nModel.setBoundingBox([234,23,0,0]);
        });

        nModel.setBoundingBox(neume1_bb);

        equal(nModel.zone.ulx, neume1_bb[0]);
        equal(nModel.zone.uly, neume1_bb[1]);
        equal(nModel.zone.lrx, neume1_bb[2]);
        equal(nModel.zone.lry, neume1_bb[3]);

        // test float truncation
        float_bb = $.map(neume1_bb, function(el) { return el + 0.765; });
        nModel.setBoundingBox(float_bb);

        equal(nModel.zone.ulx, neume1_bb[0]+1);
        equal(nModel.zone.uly, neume1_bb[1]+1);
        equal(nModel.zone.lrx, neume1_bb[2]+1);
        equal(nModel.zone.lry, neume1_bb[3]+1);
    });

    test("Set ID", function() {
        var nModel = new Toe.Model.Neume();
        nModel.setID(1);

        equal(nModel.id, 1);
    });

    test("Set Staff", function() {
        var nModel = new Toe.Model.Neume();
        var sModel = new Toe.Model.Staff(staff_bb);

        nModel.setStaff(sModel);

        equal(nModel.staff, sModel);

        // test object is not a staff
        raises(function() {
            nModel.setStaff(new Object());
        });
    });

    test("Get Root Pitch", function() {
        var n2 = new Toe.Model.Neume();       
        n2.addComponent("punctum", "a", 3);
        n2.addComponent("punctum", "g", 3);
        n2.addComponent("punctum", "a", 3);

        var pitchInfo = n2.getRootPitchInfo();
        equal(pitchInfo["pname"], "a");
        equal(pitchInfo["oct"], 3);
    });

    test("Set Root Staff Position", function() {
        var n2 = new Toe.Model.Neume();
        n2.setBoundingBox(neume2_bb);
        n2.addComponent("punctum", "a", 3);
        n2.addComponent("punctum", "g", 3);
        n2.addComponent("punctum", "a", 3);
        var clefModel = new Toe.Model.Clef("c", {staffPos: 0});
        clefModel.setBoundingBox(clef_bb);
        var sModel = new Toe.Model.Staff(staff_bb);

        sModel.addClef(clefModel);
        sModel.addNeume(n2);

        equal(n2.rootStaffPos, -2);
        var pitchInfo = n2.getPitchInfo();
        equal(pitchInfo[0].pname, "a");
        equal(pitchInfo[0].oct, 3);
        equal(pitchInfo[1].pname, "g");
        equal(pitchInfo[1].oct, 3);
        equal(pitchInfo[2].pname, "a");
        equal(pitchInfo[2].oct, 3);

        n2.setRootStaffPos(-4);

        equal(n2.rootStaffPos, -4);
        equal(pitchInfo[0].pname, "a");
        equal(pitchInfo[0].oct, 3);
        equal(pitchInfo[1].pname, "g");
        equal(pitchInfo[1].oct, 3);
        equal(pitchInfo[2].pname, "a");
        equal(pitchInfo[2].oct, 3);
    });

    asyncTest("Neume from MEI", function() {
        // read the test mei document to grab a neume
        $.get(testMeiPath, function(mei) {
            var n = new Toe.Model.Neume();

            // test constructing a neume from a wrong mei element
            raises(function() {
                var d_mei = $(mei).find("division[xml\\:id=m-e9c811f4-d126-492b-9939-fa2ada4a5b78]")[0];
                // <zone xml:id="m-abdc88db-ac94-4153-8575-ac86b7afa75e" ulx="503" uly="320" lrx="505" lry="388"/>
                n.neumeFromMei(d_mei, [440, 288, 445, 321]);
            });

            // test constructing a torculus with different head shapes from mei
            n = new Toe.Model.Neume();
            nid = "m-ab889897-6fbe-425f-8051-4312bdcbb1e2";
            var n_mei = $(mei).find("neume[xml\\:id=" + nid + "]")[0];
            // <zone xml:id="m-2fb29e73-b97a-4ca5-91bd-4324220693b3" ulx="100" uly="1938" lrx="150" lry="2047"/>
            var torculus_bb = [100, 1938, 150, 2047];
            n.neumeFromMei(n_mei, torculus_bb);

            equal(n.id, nid);
            equal(n.zone.ulx, torculus_bb[0]);
            equal(n.zone.uly, torculus_bb[1]);
            equal(n.zone.lrx, torculus_bb[2]);
            equal(n.zone.lry, torculus_bb[3]);
            equal(n.components.length, 3);

            var pitchInfo = n.getPitchInfo();
            equal(pitchInfo[0]["pname"], "g");
            equal(pitchInfo[0]["oct"], 3);
            equal(pitchInfo[1]["pname"], "c");
            equal(pitchInfo[1]["oct"], 4);
            equal(pitchInfo[2]["pname"], "e");
            equal(pitchInfo[2]["oct"], 3);

            // test head shapes are correct
            equal(n.components[0].props.type, "punctum_inclinatum");
            equal(n.components[1].props.type, "quilisma");
            equal(n.components[2].props.type, "punctum_inclinatum");

            // test cavum
            n = new Toe.Model.Neume();
            nid = "m-4e7be433-7e4b-4caf-97f2-32e711a9eb74";
            n_mei = $(mei).find("neume[xml\\:id=" + nid + "]")[0];
            // <zone xml:id="m-7e519001-1bfd-4435-b23b-7766a9eaf3f3" ulx="264" uly="315" lrx="295" lry="348"/>
            var cavum_bb = [264, 315, 295, 348];
            n.neumeFromMei(n_mei, cavum_bb);

            equal(n.id, nid);
            equal(n.zone.ulx, cavum_bb[0]);
            equal(n.zone.uly, cavum_bb[1]);
            equal(n.zone.lrx, cavum_bb[2]);
            equal(n.zone.lry, cavum_bb[3]);
            equal(n.components.length, 1);

            var rootPitchInfo = n.getRootPitchInfo();
            equal(rootPitchInfo["pname"], "a");
            equal(rootPitchInfo["oct"], 3);

            // test note head shape
            equal(n.components[0].props.type, "cavum");

            // test ornament
            ok(n.components[0].hasOrnament('dot'));

            // test virga
            n = new Toe.Model.Neume();
            nid = "m-ab23d739-29e7-434e-b5d7-7e3a2135a405";
            n_mei = $(mei).find("neume[xml\\:id=" + nid + "]")[0];
            // <zone xml:id="m-21263449-bc2c-45f0-b331-ee05aa5e59da" ulx="355" uly="349" lrx="386" lry="423"/>
            var virga_bb = [355, 349, 386, 423];
            n.neumeFromMei(n_mei, virga_bb);

            equal(n.id, nid);
            equal(n.zone.ulx, virga_bb[0]);
            equal(n.zone.uly, virga_bb[1]);
            equal(n.zone.lrx, virga_bb[2]);
            equal(n.zone.lry, virga_bb[3]);
            equal(n.components.length, 1);

            var rootPitchInfo = n.getRootPitchInfo();
            equal(rootPitchInfo["pname"], "f");
            equal(rootPitchInfo["oct"], 3);

            // test note head shape
            equal(n.components[0].props.type, "virga");

            start();
        });
    });

    // also tests get neume component differences
    test("Add Neume Components", function() {
        var nModel = new Toe.Model.Neume();
        nModel.setBoundingBox(neume2_bb);
        
        nModel.addComponent("punctum", "c", 4);
        nModel.addComponent("punctum_inclinatum_parvum", "a", 3);

        // add a component in the middle
        nModel.addComponent("punctum_inclinatum", "b", 3, {ncInd: 1});

        var pitchInfo = nModel.getPitchInfo();
        equal(pitchInfo[0]["pname"], "c");
        equal(pitchInfo[0]["oct"], 4);
        equal(nModel.components[0].props.type, "punctum");
        equal(pitchInfo[1]["pname"], "b");
        equal(pitchInfo[1]["oct"], 3);
        equal(nModel.components[1].props.type, "punctum_inclinatum");
        equal(pitchInfo[2]["pname"], "a");
        equal(pitchInfo[2]["oct"], 3);
        equal(nModel.components[2].props.type, "punctum_inclinatum_parvum");
    });

    test("Get Differences", function() {
        var sModel = new Toe.Model.Staff(staff_bb);
        var cModel = new Toe.Model.Clef("c", {staffPos: 0});
        cModel.setBoundingBox(clef_bb);
        sModel.addClef(cModel);

        var nModel = new Toe.Model.Neume();
        nModel.setBoundingBox(neume2_bb);
        
        var diffs = [-1, -2];
        nModel.addComponent("punctum", "c", 4);
        nModel.addComponent("punctum_inclinatum", "b", 3);
        nModel.addComponent("punctum_inclinatum", "a", 3);

        // add this neume to the staff
        sModel.addNeume(nModel);

        deepEqual(nModel.getDifferences(), diffs);
    });

    test("Differences to Melodic Movement", function() {
        var sModel = new Toe.Model.Staff(staff_bb);
        var cModel = new Toe.Model.Clef("c", {staffPos: 0});
        cModel.setBoundingBox(clef_bb);
        sModel.addClef(cModel);

        // test ascending melodic movement with a step that is > 1
        var n1 = new Toe.Model.Neume();
        n1.setBoundingBox([325, 326, 350, 376]);
        n1.addComponent("punctum", "d", 3);
        n1.addComponent("punctum", "a", 3);
        n1.addComponent("punctum", "b", 3);
        sModel.addNeume(n1);

        deepEqual(n1.getDifferences(), [4, 5]);
        deepEqual(n1.diffToMelodicMove(), [1, 1]);

        // test descending melodic movement
        var n2 = new Toe.Model.Neume();
        n2.setBoundingBox(neume2_bb);
        n2.addComponent("punctum", "c", 4);
        n2.addComponent("punctum_inclinatum", "b", 3);
        n2.addComponent("punctum_inclinatum", "a", 3);

        // add this neume to the staff
        sModel.addNeume(n2);

        deepEqual(n2.getDifferences(), [-1, -2]);
        deepEqual(n2.diffToMelodicMove(), [-1, -1]);
    });

    test("Derive Neume Name", function() {
        
    });

})();
