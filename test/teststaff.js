(function() {
    module("Staff");

    // <zone lry="406" lrx="1450" xml:id="m-0ac66c2a-bebd-493a-94bc-cfa2a0ba0489" uly="302" ulx="190"/>
    var staff_bb = [190, 302, 1450, 406];

    test("Constructor", function() {
        // test invalid bounding box argument
        raises(function() { 
            new Toe.Model.Staff([100,100,0,0]);
        });

        var sModel = new Toe.Model.Staff(staff_bb);

        equal(sModel.zone.ulx, staff_bb[0]);
        equal(sModel.zone.uly, staff_bb[1]);
        equal(sModel.zone.lrx, staff_bb[2]);
        equal(sModel.zone.lry, staff_bb[3]);

        // test default properties
        equal(sModel.props.numLines, 4);
        ok(!sModel.props.interact);

        // test distance between staff lines
        var line_dist = Math.abs(staff_bb[3] - staff_bb[1]) / 3;
        equal(sModel.delta_y, line_dist);

        equal(sModel.id, null);
        equal(sModel.custos, null);
        deepEqual(sModel.elements, new Array());

        // test optional parameters
        sModel = new Toe.Model.Staff(staff_bb, {numLines: 6, interact: true});
        equal(sModel.props.numLines, 6);
        line_dist = Math.abs(staff_bb[3] - staff_bb[1]) / 5;
        equal(sModel.delta_y, line_dist);
        ok(sModel.props.interact);
    });

    test("Set ID", function() {
        var sModel = new Toe.Model.Staff(staff_bb);
        sModel.setID(42);

        equal(sModel.id, 42);
    });

    test("Set Bounding Box", function() {
        var sModel = new Toe.Model.Staff([2,2,200,200]);

        // test invalid bounding box argument
        raises(function() { 
            sModel.setBoundingBox([234,23,0,0]);
        });

        sModel.setBoundingBox(staff_bb);
        equal(sModel.zone.ulx, staff_bb[0]);
        equal(sModel.zone.uly, staff_bb[1]);
        equal(sModel.zone.lrx, staff_bb[2]);
        equal(sModel.zone.lry, staff_bb[3]);
    });

})();
