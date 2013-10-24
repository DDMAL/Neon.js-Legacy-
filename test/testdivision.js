(function() {
    module("Division");
  
    // <zone xml:id="m-0ac66c2a-bebd-493a-94bc-cfa2a0ba0489" lry="406" lrx="1450" uly="302" ulx="190"/>
    var system_bb = [190, 302, 406, 1450];
    // <zone xml:id="m-abdc88db-ac94-4153-8575-ac86b7afa75e" ulx="503" uly="320" lrx="505" lry="388"/>
    var division_bb = [503, 320, 505, 388];

    test("Constructor", function() {

        // test invalid division type
        raises(function() {
            new Toe.Model.Division("blah");
        });

        var dModel = new Toe.Model.Division("div_small");
        equal(dModel.key, "div_small");
        equal(dModel.type, Toe.Model.Division.Type.div_small);
        deepEqual(dModel.zone, new Object());
        equal(dModel.id, null);
        equal(dModel.system, null);

        var dModel = new Toe.Model.Division("div_minor");
        equal(dModel.key, "div_minor");
        equal(dModel.type, Toe.Model.Division.Type.div_minor);

        var dModel = new Toe.Model.Division("div_major");
        equal(dModel.key, "div_major");
        equal(dModel.type, Toe.Model.Division.Type.div_major);

        var dModel = new Toe.Model.Division("div_final");
        equal(dModel.key, "div_final");
        equal(dModel.type, Toe.Model.Division.Type.div_final);
    });

    test("Set Bounding Box", function() {
        var dModel = new Toe.Model.Division("div_minor");

        // test invalid bounding box argument
        raises(function() { 
            dModel.setBoundingBox([-100,0,-200,0]);
        });


        dModel.setBoundingBox(division_bb);

        equal(dModel.zone.ulx, division_bb[0]);
        equal(dModel.zone.uly, division_bb[1]);
        equal(dModel.zone.lrx, division_bb[2]);
        equal(dModel.zone.lry, division_bb[3]);

        // test float truncation
        float_bb = $.map(division_bb, function(el) { return el + 0.432; });
        dModel.setBoundingBox(float_bb);

        equal(dModel.zone.ulx, division_bb[0]);
        equal(dModel.zone.uly, division_bb[1]);
        equal(dModel.zone.lrx, division_bb[2]);
        equal(dModel.zone.lry, division_bb[3]);
    });

    test("Set ID", function() {
        var dModel = new Toe.Model.Division("div_major");
        dModel.setID(42);

        equal(dModel.id, 42);
    });

    test("Set System", function() {
        var dModel = new Toe.Model.Division("div_final");
        var sModel = new Toe.Model.System(system_bb);

        dModel.setSystem(sModel);

        equal(dModel.system, sModel);

        // test object is not a system
        raises(function() {
            dModel.setSystem(new Object());
        });
    });

})();

