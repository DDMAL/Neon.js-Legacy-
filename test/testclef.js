( function( QUnit ) {
    QUnit.module( "Clef" );

    // <zone lry="331" lrx="208" xml:id="m-5ff17ad0-6396-4f4b-9c99-de55e140ee97" uly="278" ulx="190"/>
    var clef_bb = [ 190, 278, 208, 331 ];

    // <zone xml:id="m-0ac66c2a-bebd-493a-94bc-cfa2a0ba0489" lry="406" lrx="1450" uly="302" ulx="190"/>
    var system_bb = [ 190, 302, 406, 1450 ];

    // <zone lry="349" lrx="258" xml:id="m-df35aa9a-9155-4c89-a8b2-a05688156807" uly="328" ulx="240"/>
    var neume1_bb = [ 240, 328, 258, 349 ];

    // <zone lry="376" lrx="315" xml:id="m-b06676a3-4aa1-430d-b1c8-3d3fcf606f0e" uly="326" ulx="265"/>
    var neume2_bb = [ 265, 326, 315, 376 ];

    QUnit.test( "Constructor", function( assert ) {
        var cClefModel = new Toe.Model.Clef( "c" );
        var fClefModel = new Toe.Model.Clef( "f" );

        assert.equal( cClefModel.shape, "c" );
        assert.equal( cClefModel.name, "Doh Clef" );
        assert.equal( fClefModel.shape, "f" );
        assert.equal( fClefModel.name, "Fah Clef" );

        assert.deepEqual( cClefModel.zone, {} );
        assert.equal( cClefModel.system, null );

        // Check default system line has been set correctly
        assert.equal( cClefModel.props.systemPos, 0 );
        assert.equal( fClefModel.props.systemPos, 2 );

        // Test default properties
        assert.ok( cClefModel.props.interact );

        // Test invalid clef shape
        assert.raises( function() {
            new Toe.Model.Clef( "z" );
        } );

        // Test manual settings
        cClefModel = new Toe.Model.Clef( "c", { systemPos: 3, interact: false } );
        assert.equal( cClefModel.props.systemPos, 3 );
        assert.ok( !cClefModel.props.interact );
    } );

    QUnit.test( "Set ID", function( assert ) {
        var cClefModel = new Toe.Model.Clef( "c" );
        cClefModel.setID( 4 );

        assert.equal( cClefModel.id, 4 );
    } );

    QUnit.test( "Set System", function( assert ) {
        var cClefModel = new Toe.Model.Clef( "c" );

        // Get system data
        var sModel = new Toe.Model.System( system_bb );

        cClefModel.setSystem( sModel );

        assert.equal( cClefModel.system, sModel );

        // Test object is not a system
        assert.raises( function() {
            cClefModel.setSystem( new Object() );
        } );
    } );

    QUnit.test( "Set Shape", function( assert ) {
        var cClefModel = new Toe.Model.Clef( "c" );
        cClefModel.setBoundingBox( clef_bb );

        var sModel = new Toe.Model.System( system_bb );
        sModel.addClef( cClefModel, { justPush: true } );

        // Add two test neumes to the system this clef is on
        var n1 = new Toe.Model.Neume();
        n1.setBoundingBox( neume1_bb );
        n1.addComponent( "punctum", "a", 3 );

        var n2 = new Toe.Model.Neume();
        n2.setBoundingBox( neume2_bb );
        n2.addComponent( "punctum", "a", 3 );
        n2.addComponent( "punctum", "g", 3 );
        n2.addComponent( "punctum", "a", 3 );

        sModel.addNeume( n1, { justPush: true } );
        sModel.addNeume( n2, { justPush: true } );

        assert.equal( sModel.elements[ 1 ].rootSystemPos, -2 );
        assert.equal( sModel.elements[ 1 ].components[ 0 ].pname, "a" );
        assert.equal( sModel.elements[ 1 ].components[ 0 ].oct, 3 );

        assert.equal( sModel.elements[ 2 ].rootSystemPos, -2 );
        assert.equal( sModel.elements[ 2 ].components[ 0 ].pname, "a" );
        assert.equal( sModel.elements[ 2 ].components[ 0 ].oct, 3 );
        assert.equal( sModel.elements[ 2 ].components[ 1 ].pname, "g" );
        assert.equal( sModel.elements[ 2 ].components[ 0 ].oct, 3 );
        assert.equal( sModel.elements[ 2 ].components[ 2 ].pname, "a" );
        assert.equal( sModel.elements[ 2 ].components[ 0 ].oct, 3 );

        cClefModel.setShape( "f" );

        assert.equal( cClefModel.shape, "f" );
        assert.equal( cClefModel.name, "Fah Clef" );

        // Test pitch shift of elements
        assert.equal( sModel.elements[ 1 ].rootSystemPos, -2 );
        assert.equal( sModel.elements[ 1 ].components[ 0 ].pname, "d" );
        assert.equal( sModel.elements[ 1 ].components[ 0 ].oct, 3 );

        assert.equal( sModel.elements[ 2 ].rootSystemPos, -2 );
        assert.equal( sModel.elements[ 2 ].components[ 0 ].pname, "d" );
        assert.equal( sModel.elements[ 1 ].components[ 0 ].oct, 3 );
        assert.equal( sModel.elements[ 2 ].components[ 1 ].pname, "c" );
        assert.equal( sModel.elements[ 1 ].components[ 0 ].oct, 3 );
        assert.equal( sModel.elements[ 2 ].components[ 2 ].pname, "d" );
        assert.equal( sModel.elements[ 1 ].components[ 0 ].oct, 3 );

        // Test invalid clef shape
        assert.raises( function() {
            cClef.Model.setShape( "z" );
        } );
    } );

    QUnit.test( "Set Bounding Box", function( assert ) {
        var cClefModel = new Toe.Model.Clef( "c" );

        // Test invalid bounding box argument
        assert.raises( function() {
            cClefModel.setBoundingBox( [ -100, 0, -200, 0 ] );
        } );

        cClefModel.setBoundingBox( clef_bb );

        assert.equal( cClefModel.zone.ulx, clef_bb[ 0 ] );
        assert.equal( cClefModel.zone.uly, clef_bb[ 1 ] );
        assert.equal( cClefModel.zone.lrx, clef_bb[ 2 ] );
        assert.equal( cClefModel.zone.lry, clef_bb[ 3 ] );

        // Test float truncation
        float_bb = $.map( clef_bb, function( el ) { return el + 0.243; } );
        cClefModel.setBoundingBox( float_bb );

        assert.equal( cClefModel.zone.ulx, clef_bb[ 0 ] );
        assert.equal( cClefModel.zone.uly, clef_bb[ 1 ] );
        assert.equal( cClefModel.zone.lrx, clef_bb[ 2 ] );
        assert.equal( cClefModel.zone.lry, clef_bb[ 3 ] );
    } );

    QUnit.test( "Set System Position", function( assert ) {
        var cClefModel = new Toe.Model.Clef( "c", { systemPos: 0 } );
        cClefModel.setBoundingBox( clef_bb );

        var sModel = new Toe.Model.System( system_bb );
        sModel.addClef( cClefModel, { justPush: true } );

        // Add two test neumes to the system this clef is on
        var n1 = new Toe.Model.Neume();
        n1.setBoundingBox( neume1_bb );
        n1.addComponent( "punctum", "a", 3 );

        var n2 = new Toe.Model.Neume();
        n2.setBoundingBox( neume2_bb );
        n2.addComponent( "punctum", "a", 3 );
        n2.addComponent( "punctum", "g", 3 );
        n2.addComponent( "punctum", "a", 3 );

        sModel.addNeume( n1, { justPush: true } );
        sModel.addNeume( n2, { justPush: true } );

        assert.equal( sModel.elements[ 1 ].rootSystemPos, -2 );
        assert.equal( sModel.elements[ 1 ].components[ 0 ].pname, "a" );
        assert.equal( sModel.elements[ 1 ].components[ 0 ].oct, 3 );

        assert.equal( sModel.elements[ 2 ].rootSystemPos, -2 );
        assert.equal( sModel.elements[ 2 ].components[ 0 ].pname, "a" );
        assert.equal( sModel.elements[ 2 ].components[ 0 ].oct, 3 );
        assert.equal( sModel.elements[ 2 ].components[ 1 ].pname, "g" );
        assert.equal( sModel.elements[ 2 ].components[ 0 ].oct, 3 );
        assert.equal( sModel.elements[ 2 ].components[ 2 ].pname, "a" );
        assert.equal( sModel.elements[ 2 ].components[ 0 ].oct, 3 );

        cClefModel.setSystemPosition( -4 );
        assert.equal( cClefModel.props.systemPos, -4 );

        // Test pitch shift of elements
        assert.equal( sModel.elements[ 1 ].rootSystemPos, -2 );
        assert.equal( sModel.elements[ 1 ].components[ 0 ].pname, "e" );
        assert.equal( sModel.elements[ 1 ].components[ 0 ].oct, 4 );

        assert.equal( sModel.elements[ 2 ].rootSystemPos, -2 );
        assert.equal( sModel.elements[ 2 ].components[ 0 ].pname, "e" );
        assert.equal( sModel.elements[ 1 ].components[ 0 ].oct, 4 );
        assert.equal( sModel.elements[ 2 ].components[ 1 ].pname, "d" );
        assert.equal( sModel.elements[ 1 ].components[ 0 ].oct, 4 );
        assert.equal( sModel.elements[ 2 ].components[ 2 ].pname, "e" );
        assert.equal( sModel.elements[ 1 ].components[ 0 ].oct, 4 );
    } );

} )( QUnit );
