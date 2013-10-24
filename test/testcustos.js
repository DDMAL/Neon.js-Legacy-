(function() {
    module("Custos");
  
    // <zone lry="331" lrx="208" xml:id="m-5ff17ad0-6396-4f4b-9c99-de55e140ee97" uly="278" ulx="190"/>
    var clef_bb = [190, 278, 208, 331];
    // <zone xml:id="m-0ac66c2a-bebd-493a-94bc-cfa2a0ba0489" lry="406" lrx="1450" uly="302" ulx="190"/>
    var system_bb = [190, 302, 406, 1450];
    // <zone xml:id="m-569cd97f-8c90-41b9-b2ad-4fd71ec52b8a" ulx="1439" uly="310" lrx="1446" lry="345"/>
    var custos_bb = [1439, 310, 1446, 345];

    test("Constructor", function() {
        var cModel = new Toe.Model.Custos("a", 3);

        ok(cModel.props.interact);
        equal(cModel.pname, "a");
        equal(cModel.oct, 3);
        equal(cModel.rootSystemPos, null);
        deepEqual(cModel.zone, new Object());
        equal(cModel.id, null);
        equal(cModel.system, null);

        cModel = new Toe.Model.Custos("c", 4, {interact: false});
        ok(!cModel.props.interact);
    });

    test("Set Bounding Box", function() {
        var cModel = new Toe.Model.Custos("f", 2);

        // test invalid bounding box argument
        raises(function() { 
            cModel.setBoundingBox([-100,0,-200,0]);
        });


        cModel.setBoundingBox(custos_bb);

        equal(cModel.zone.ulx, custos_bb[0]);
        equal(cModel.zone.uly, custos_bb[1]);
        equal(cModel.zone.lrx, custos_bb[2]);
        equal(cModel.zone.lry, custos_bb[3]);

        // test float truncation
        float_bb = $.map(custos_bb, function(el) { return el + 0.432; });
        cModel.setBoundingBox(float_bb);

        equal(cModel.zone.ulx, custos_bb[0]);
        equal(cModel.zone.uly, custos_bb[1]);
        equal(cModel.zone.lrx, custos_bb[2]);
        equal(cModel.zone.lry, custos_bb[3]);

    });

    test("Set ID", function() {
        var cModel = new Toe.Model.Custos("a", 3);
        cModel.setID(42);

        equal(cModel.id, 42);
    });

    test("Set System", function() {
        var cModel = new Toe.Model.Custos("a", 3);
        var sModel = new Toe.Model.System(system_bb);

        cModel.setSystem(sModel);

        equal(cModel.system, sModel);

        // test object is not a system
        raises(function() {
            cModel.setSystem(new Object());
        });
    });

    test("Set Root Note", function() {
        var cModel = new Toe.Model.Custos("a", 3);

        equal(cModel.pname, "a");
        equal(cModel.oct, "3");

        cModel.setRootNote("c", 4);
        
        equal(cModel.pname, "c");
        equal(cModel.oct, 4);
    });

    test("Set Root System Pos", function() {
        var custosModel = new Toe.Model.Custos("a", 3);
        custosModel.setBoundingBox(custos_bb);
        var clefModel = new Toe.Model.Clef("c", {systemPos: 0});
        clefModel.setBoundingBox(clef_bb);
        var sModel = new Toe.Model.System(system_bb);

        sModel.addClef(clefModel);
        sModel.setCustos(custosModel);

        equal(custosModel.rootSystemPos, -2);
        equal(custosModel.pname, "a");
        equal(custosModel.oct, 3);

        custosModel.setRootSystemPos(-4);

        equal(custosModel.rootSystemPos, -4);
        equal(custosModel.pname, "f");
        equal(custosModel.oct, 3);
    });

})();
