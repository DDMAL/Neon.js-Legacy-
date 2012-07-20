(function() {
    module("Neume");

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

    test("Neume from MEI", function() {
    });

    // also tests get neume component differences
    test("Add Neume Components", function() {
        var sModel = new Toe.Model.Staff(staff_bb);
        var cModel = new Toe.Model.Clef("c", {staffPos: 0});
        cModel.setBoundingBox(clef_bb);
        sModel.addClef(cModel);

        var nModel = new Toe.Model.Neume();
        nModel.setBoundingBox(neume2_bb);
        
        var diffs = [-1, -2];
        nModel.addComponent("punctum", "c", 4);
        nModel.addComponent("punctum_inclinatum", "a", 3);

        // add a component in the middle
        nModel.addComponent("punctum_inclinatum", "b", 3, {ncInd: 1});

        // add this neume to the staff
        sModel.addNeume(nModel);

        deepEqual(nModel.getDifferences(), diffs);
    });

})();
