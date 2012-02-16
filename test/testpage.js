(function() {
    var meiFacsRef = '<facsimile xml:id="m-1c0ae9e6-d941-4587-80a2-13d7925d162b"><surface xml:id="m-4954b1c5-9c05-4963-accb-b6e351e3b6b4"><graphic xmlns:xlink="http://www.w3.org/1999/xlink" xml:id="m-3280ce80-c645-4931-b945-2b0c00ca771f" xlink:href="400_original_image.tiff"/><zone lry="331" lrx="208" xml:id="m-5ff17ad0-6396-4f4b-9c99-de55e140ee97" uly="278" ulx="190"/><zone lry="349" lrx="258" xml:id="m-df35aa9a-9155-4c89-a8b2-a05688156807" uly="328" ulx="240"/><zone lry="376" lrx="315" xml:id="m-b06676a3-4aa1-430d-b1c8-3d3fcf606f0e" uly="326" ulx="265"/><zone lry="417" lrx="379" xml:id="m-e56a80e9-0fe3-4946-a9f5-6124e6b115c3" uly="385" ulx="349"/><zone lry="321" lrx="445" xml:id="m-237f98b6-0714-42ad-a1ac-e1fa376b0ac3" uly="288" ulx="440"/></surface></facsimile>';

    module("Page");

    test("Constructor", function() {
        var pModel = new Toe.Model.Page();

        equal(pModel.staves.length, 0);
    });

    test("Set Dimensions", function() {
        var pModel = new Toe.Model.Page();

        var w = 1024;
        var h = 768;
        pModel.setDimensions(w,h);

        equal(pModel.width, w);
        equal(pModel.height, h);
    });

    test("Calc Dimensions MEI", function() {
        var pModel = new Toe.Model.Page();
        var dims = pModel.calcDimensions($(meiFacsRef).find("zone"));
        
        equal(dims[0], 445);
        equal(dims[1], 417);
    });

    test("Add Staves", function() {
        var numStaves = 4;

        var pModel = new Toe.Model.Page();
        for (var i = 0; i < numStaves; i++) {
            var sModel = new Toe.Model.Staff([0, 0, 100, 100]);
            pModel.addStaff(sModel);
        }

        equal(pModel.staves.length, numStaves);
    });
})();
