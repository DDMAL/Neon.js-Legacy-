( function( QUnit ) {
    QUnit.module( "Division" );

    // <zone xml:id="m-0ac66c2a-bebd-493a-94bc-cfa2a0ba0489" lry="406" lrx="1450" uly="302" ulx="190"/>
    var system_bb = [ 190, 302, 406, 1450 ];

    // <zone xml:id="m-abdc88db-ac94-4153-8575-ac86b7afa75e" ulx="503" uly="320" lrx="505" lry="388"/>
    var division_bb = [ 503, 320, 505, 388 ];

    QUnit.test( "Constructor", function( assert ) {

        // Test invalid division type
        assert.raises( function() {
            new Toe.Model.Division( "blah" );
        } );

        var dModel = new Toe.Model.Division( "div_small" );
        assert.equal( dModel.key, "div_small" );
        assert.equal( dModel.type, Toe.Model.Division.Type.div_small );
        assert.deepEqual( dModel.zone, new Object() );
        assert.equal( dModel.id, null );
        assert.equal( dModel.system, null );

        var dModel = new Toe.Model.Division( "div_minor" );
        assert.equal( dModel.key, "div_minor" );
        assert.equal( dModel.type, Toe.Model.Division.Type.div_minor );

        var dModel = new Toe.Model.Division( "div_major" );
        assert.equal( dModel.key, "div_major" );
        assert.equal( dModel.type, Toe.Model.Division.Type.div_major );

        var dModel = new Toe.Model.Division( "div_final" );
        assert.equal( dModel.key, "div_final" );
        assert.equal( dModel.type, Toe.Model.Division.Type.div_final );
    } );

    QUnit.test( "Set Bounding Box", function( assert ) {
        var dModel = new Toe.Model.Division( "div_minor" );

        // Test invalid bounding box argument
        assert.raises( function() {
            dModel.setBoundingBox( [ -100, 0, -200, 0 ] );
        } );

        dModel.setBoundingBox( division_bb );

        assert.equal( dModel.zone.ulx, division_bb[ 0 ] );
        assert.equal( dModel.zone.uly, division_bb[ 1 ] );
        assert.equal( dModel.zone.lrx, division_bb[ 2 ] );
        assert.equal( dModel.zone.lry, division_bb[ 3 ] );

        // Test float truncation
        float_bb = $.map( division_bb, function( el ) { return el + 0.432; } );
        dModel.setBoundingBox( float_bb );

        assert.equal( dModel.zone.ulx, division_bb[ 0 ] );
        assert.equal( dModel.zone.uly, division_bb[ 1 ] );
        assert.equal( dModel.zone.lrx, division_bb[ 2 ] );
        assert.equal( dModel.zone.lry, division_bb[ 3 ] );
    } );

    QUnit.test( "Set ID", function( assert ) {
        var dModel = new Toe.Model.Division( "div_major" );
        dModel.setID( 42 );

        assert.equal( dModel.id, 42 );
    } );

    QUnit.test( "Set System", function( assert ) {
        var dModel = new Toe.Model.Division( "div_final" );
        var sModel = new Toe.Model.System( system_bb );

        dModel.setSystem( sModel );

        assert.equal( dModel.system, sModel );

        // Test object is not a system
        assert.raises( function() {
            dModel.setSystem( new Object() );
        } );
    } );

} )( QUnit );

