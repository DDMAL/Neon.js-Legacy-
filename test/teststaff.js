(function() {
    module("System");

    // <zone lry="406" lrx="1450" xml:id="m-0ac66c2a-bebd-493a-94bc-cfa2a0ba0489" uly="302" ulx="190"/>
    var system_bb = [190, 302, 1450, 406];

    test("Constructor", function() {
        // test invalid bounding box argument
        raises(function() { 
            new Toe.Model.System([100,100,0,0]);
        });

        var sModel = new Toe.Model.System(system_bb);

        equal(sModel.zone.ulx, system_bb[0]);
        equal(sModel.zone.uly, system_bb[1]);
        equal(sModel.zone.lrx, system_bb[2]);
        equal(sModel.zone.lry, system_bb[3]);

        // test default properties
        equal(sModel.props.numLines, 4);
        ok(!sModel.props.interact);

        // test distance between system lines
        var line_dist = Math.abs(system_bb[3] - system_bb[1]) / 3;
        equal(sModel.delta_y, line_dist);

        equal(sModel.id, null);
        equal(sModel.custos, null);
        deepEqual(sModel.elements, new Array());

        // test optional parameters
        sModel = new Toe.Model.System(system_bb, {numLines: 6, interact: true});
        equal(sModel.props.numLines, 6);
        line_dist = Math.abs(system_bb[3] - system_bb[1]) / 5;
        equal(sModel.delta_y, line_dist);
        ok(sModel.props.interact);
    });

    test("Set ID", function() {
        var sModel = new Toe.Model.System(system_bb);
        sModel.setID(42);

        equal(sModel.id, 42);
    });

    test("Set Bounding Box", function() {
        var sModel = new Toe.Model.System([2,2,200,200]);

        // test invalid bounding box argument
        raises(function() { 
            sModel.setBoundingBox([234,23,0,0]);
        });

        sModel.setBoundingBox(system_bb);
        equal(sModel.zone.ulx, system_bb[0]);
        equal(sModel.zone.uly, system_bb[1]);
        equal(sModel.zone.lrx, system_bb[2]);
        equal(sModel.zone.lry, system_bb[3]);
    });

})();
