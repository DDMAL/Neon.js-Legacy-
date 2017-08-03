( function( QUnit ) {
    QUnit.module( "System" );

    // <zone lry="406" lrx="1450" xml:id="m-0ac66c2a-bebd-493a-94bc-cfa2a0ba0489" uly="302" ulx="190"/>
    var system_bb = [ 190, 302, 1450, 406 ];

    QUnit.test( "Constructor", function( assert ) {

        // Test invalid bounding box argument
        assert.raises( function() {
            new Toe.Model.System( [ 100, 100, 0, 0 ] );
        } );

        var sModel = new Toe.Model.System( system_bb );

        assert.equal( sModel.zone.ulx, system_bb[ 0 ] );
        assert.equal( sModel.zone.uly, system_bb[ 1 ] );
        assert.equal( sModel.zone.lrx, system_bb[ 2 ] );
        assert.equal( sModel.zone.lry, system_bb[ 3 ] );

        // Test default properties
        assert.equal( sModel.props.numLines, 4 );
        assert.ok( !sModel.props.interact );

        // Test distance between system lines
        var line_dist = Math.abs( system_bb[ 3 ] - system_bb[ 1 ] ) / 3;
        assert.equal( sModel.delta_y, line_dist );

        assert.equal( sModel.id, null );
        assert.equal( sModel.custos, null );
        assert.deepEqual( sModel.elements, new Array() );

        // Test optional parameters
        sModel = new Toe.Model.System( system_bb, { numLines: 6, interact: true } );
        assert.equal( sModel.props.numLines, 6 );
        line_dist = Math.abs( system_bb[ 3 ] - system_bb[ 1 ] ) / 5;
        assert.equal( sModel.delta_y, line_dist );
        assert.ok( sModel.props.interact );
    } );

    QUnit.test( "Set ID", function( assert ) {
        var sModel = new Toe.Model.System( system_bb );
        sModel.setID( 42 );

        assert.equal( sModel.id, 42 );
    } );

    QUnit.test( "Set Bounding Box", function( assert ) {
        var sModel = new Toe.Model.System( [ 2, 2, 200, 200 ] );

        // Test invalid bounding box argument
        assert.raises( function() {
            sModel.setBoundingBox( [ 234, 23, 0, 0 ] );
        } );

        sModel.setBoundingBox( system_bb );
        assert.equal( sModel.zone.ulx, system_bb[ 0 ] );
        assert.equal( sModel.zone.uly, system_bb[ 1 ] );
        assert.equal( sModel.zone.lrx, system_bb[ 2 ] );
        assert.equal( sModel.zone.lry, system_bb[ 3 ] );
    } );

} )( QUnit );
