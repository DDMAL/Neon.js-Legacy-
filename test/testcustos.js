( function( QUnit ) {
    QUnit.module( "Custos" );

    // <zone lry="331" lrx="208" xml:id="m-5ff17ad0-6396-4f4b-9c99-de55e140ee97" uly="278" ulx="190"/>
    var clef_bb = [ 190, 278, 208, 331 ];

    // <zone xml:id="m-0ac66c2a-bebd-493a-94bc-cfa2a0ba0489" lry="406" lrx="1450" uly="302" ulx="190"/>
    var system_bb = [ 190, 302, 406, 1450 ];

    // <zone xml:id="m-569cd97f-8c90-41b9-b2ad-4fd71ec52b8a" ulx="1439" uly="310" lrx="1446" lry="345"/>
    var custos_bb = [ 1439, 310, 1446, 345 ];

    QUnit.test( "Constructor", function( assert ) {
        var cModel = new Toe.Model.Custos( "a", 3 );

        assert.ok( cModel.props.interact );
        assert.equal( cModel.pname, "a" );
        assert.equal( cModel.oct, 3 );
        assert.equal( cModel.rootSystemPos, null );
        assert.deepEqual( cModel.zone, new Object() );
        assert.equal( cModel.id, null );
        assert.equal( cModel.system, null );

        cModel = new Toe.Model.Custos( "c", 4, { interact: false } );
        assert.ok( !cModel.props.interact );
    } );

    QUnit.test( "Set Bounding Box", function( assert ) {
        var cModel = new Toe.Model.Custos( "f", 2 );

        // Test invalid bounding box argument
        assert.raises( function() {
            cModel.setBoundingBox( [ -100, 0, -200, 0 ] );
        } );

        cModel.setBoundingBox( custos_bb );

        assert.equal( cModel.zone.ulx, custos_bb[ 0 ] );
        assert.equal( cModel.zone.uly, custos_bb[ 1 ] );
        assert.equal( cModel.zone.lrx, custos_bb[ 2 ] );
        assert.equal( cModel.zone.lry, custos_bb[ 3 ] );

        // Test float truncation
        float_bb = $.map( custos_bb, function( el ) { return el + 0.432; } );
        cModel.setBoundingBox( float_bb );

        assert.equal( cModel.zone.ulx, custos_bb[ 0 ] );
        assert.equal( cModel.zone.uly, custos_bb[ 1 ] );
        assert.equal( cModel.zone.lrx, custos_bb[ 2 ] );
        assert.equal( cModel.zone.lry, custos_bb[ 3 ] );

    } );

    QUnit.test( "Set ID", function( assert ) {
        var cModel = new Toe.Model.Custos( "a", 3 );
        cModel.setID( 42 );

        assert.equal( cModel.id, 42 );
    } );

    QUnit.test( "Set System", function( assert ) {
        var cModel = new Toe.Model.Custos( "a", 3 );
        var sModel = new Toe.Model.System( system_bb );

        cModel.setSystem( sModel );

        assert.equal( cModel.system, sModel );

        // Test object is not a system
        assert.raises( function() {
            cModel.setSystem( new Object() );
        } );
    } );

    QUnit.test( "Set Root Note", function( assert ) {
        var cModel = new Toe.Model.Custos( "a", 3 );

        assert.equal( cModel.pname, "a" );
        assert.equal( cModel.oct, "3" );

        cModel.setRootNote( "c", 4 );

        assert.equal( cModel.pname, "c" );
        assert.equal( cModel.oct, 4 );
    } );

    QUnit.test( "Set Root System Pos", function( assert ) {
        var custosModel = new Toe.Model.Custos( "a", 3 );
        custosModel.setBoundingBox( custos_bb );
        var clefModel = new Toe.Model.Clef( "c", { systemPos: 0 } );
        clefModel.setBoundingBox( clef_bb );
        var sModel = new Toe.Model.System( system_bb );

        sModel.addClef( clefModel );
        sModel.setCustos( custosModel );

        assert.equal( custosModel.rootSystemPos, -2 );
        assert.equal( custosModel.pname, "a" );
        assert.equal( custosModel.oct, 3 );

        custosModel.setRootSystemPos( -4 );

        assert.equal( custosModel.rootSystemPos, -4 );
        assert.equal( custosModel.pname, "f" );
        assert.equal( custosModel.oct, 3 );
    } );

} )( QUnit );
