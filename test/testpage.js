( function( QUnit ) {
    var testMeiPath = "test/data/allneumes.mei";

    QUnit.module( "Page", {
        beforeEach: function( assert ) {
            var module = this;

            // Make the test mei document available to all tests
            stop();
            $.get( testMeiPath, function( data ) {
                module.mei = data;
                QUnit.start();
            } );
        }
    } );

    QUnit.test( "Constructor", function( assert ) {
        var pModel = new Toe.Model.Page();

        assert.equal( pModel.staves.length, 0 );
        assert.equal( pModel.scale, 1.0 );
    } );

    QUnit.test( "Set Dimensions", function( assert ) {
        var pModel = new Toe.Model.Page();

        var w = 1024;
        var h = 768;
        pModel.setDimensions( w, h );

        assert.equal( pModel.width, w );
        assert.equal( pModel.height, h );
    } );

    QUnit.test( "Calc Dimensions MEI", function( assert ) {
        var pModel = new Toe.Model.Page();
        var dims = pModel.calcDimensions( $( this.mei ).find( "zone" ) );

        assert.equal( dims[ 0 ], 1462 );
        assert.equal( dims[ 1 ], 2399 );
    } );

    QUnit.test( "Set Page Scale", function( assert ) {
        var pModel = new Toe.Model.Page();
        pModel.setPageScale( 0.5 );

        assert.equal( pModel.scale, 0.5 );
    } );

    QUnit.test( "Add Staves", function( assert ) {
        var numStaves = 4;

        var pModel = new Toe.Model.Page();
        for ( var i = 0; i < numStaves; i++ ) {
            var sModel = new Toe.Model.System( [ 0, 0, 100, 100 ] );
            pModel.addSystem( sModel );
        }

        assert.equal( pModel.staves.length, numStaves );
    } );

    QUnit.test( "Get Next System", function( assert ) {
        var numStaves = 4;

        var pModel = new Toe.Model.Page();
        for ( var i = 0; i < numStaves; i++ ) {
            var sModel = new Toe.Model.System( [ 0, 0, 100, 100 ] );
            pModel.addSystem( sModel );
        }

        var anchorSystem = pModel.staves[ 1 ];
        assert.deepEqual( pModel.getNextSystem( anchorSystem ), pModel.staves[ 2 ] );

        // Boundary condition
        anchorSystem = pModel.staves[ 3 ];
        assert.equal( pModel.getNextSystem( anchorSystem ), null );
    } );

    QUnit.test( "Get Previous System", function( assert ) {
        var numStaves = 4;

        var pModel = new Toe.Model.Page();
        for ( var i = 0; i < numStaves; i++ ) {
            var sModel = new Toe.Model.System( [ 0, 0, 100, 100 ] );
            pModel.addSystem( sModel );
        }

        var anchorSystem = pModel.staves[ 3 ];
        assert.deepEqual( pModel.getPreviousSystem( anchorSystem ), pModel.staves[ 2 ] );

        // Boundary condition
        anchorSystem = pModel.staves[ 0 ];
        assert.equal( pModel.getPreviousSystem( anchorSystem ), null );
    } );

    QUnit.test( "Get Closest System", function( assert ) {
        /* Taken from 0453_corr.mei Liber Usualis (Staves split by ornate letter)
         * <zone lry="1457" lrx="944" xml:id="m-9ebdc549-659c-4fff-977f-dc1bef338e0f" uly="1356" ulx="185"/>
         * <zone lry="1457" lrx="1434" xml:id="m-030e1b43-18a3-4992-a063-821ed1a0de7a" uly="1358" ulx="1160"/>
         * <zone lry="1782" lrx="1434" xml:id="m-f3f72f73-e37f-4bb9-aa16-45acc58d17f5" uly="1679" ulx="23"/>
         */

        var pModel = new Toe.Model.Page();
        s1 = new Toe.Model.System( [ 185, 1356, 944, 1457 ] );
        s2 = new Toe.Model.System( [ 1160, 1358, 1434, 1457 ] );
        s3 = new Toe.Model.System( [ 23, 1679, 1434, 1782 ] );
        pModel.addSystem( s1 );
        pModel.addSystem( s2 );
        pModel.addSystem( s3 );

        // Click above first system to the left
        assert.equal( pModel.getClosestSystem( { x: 300, y: 1200 } ), s1 );

        // Click inside first System
        assert.equal( pModel.getClosestSystem( { x: 500, y: 1400 } ), s1 );

        // Click above first two staves between the two but closer to the right one
        assert.equal( pModel.getClosestSystem( { x: 1100, y: 1300 } ), s2 );

        // Click between two staves on same x plane, but closer to left one
        assert.equal( pModel.getClosestSystem( { x: 1000, y: 1400 } ), s1 );

        // Click between the top and bottom row of staves, closer to bottom
        assert.equal( pModel.getClosestSystem( { x: 800, y: 1600 } ), s3 );
    } );

} )( QUnit );
