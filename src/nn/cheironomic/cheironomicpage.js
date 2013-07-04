/*
Copyright (C) 2011 by Gregory Burlet, Alastair Porter

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * A music score in staffless neume notation. 
 *
 * @class Represents a page of music in staffless neume notation
 * @extends Toe.Model.Page
 */
Toe.Model.CheironomicPage = function(documentType) {
    this.documentType = documentType;
}

// inherit prototype from page object
Toe.Model.CheironomicPage.prototype = new Toe.Model.Page();
Toe.Model.CheironomicPage.prototype.constructor = Toe.Model.CheironomicPage;

/**
 * Loads the page of music from an MEI file.
 *
 * @methodOf Toe.Model.CheironomicPage
 */
Toe.Model.CheironomicPage.prototype.loadMei = function(mei, rendEng) {
    // cache page reference
    var page = this;

    // TODO: derive global scale from neume dimensions
    // since it can't be figured out from the intra-staffline distance
    rendEng.setGlobalScale(0.04);

    var surface = $(mei).find("surface")[0];
    var section = $(mei).find("section")[0];
    var eles = $(section).children();

    var sbInds = new Array();
    $(eles).each(function(eit, eel) {
        if ($(eel).is("sb")) {
            sbInds.push(eit);
        }
    });
    sbInds.push(eles.length);

    var prevInd = 0;
    $(sbInds).each(function(sit, sel) {
        var neumes = $(eles).slice(prevInd, sel);

        // create staff with no stafflines as a container for the neumes
        var s_bb = [0,0,0,0];
        var sModel = new Toe.Model.CheironomicStaff(s_bb, {numLines: 0});
        sModel.setID($($(eles)[sel]).attr("xml:id"));

        // instantiate staff view and controller
        var sView = new Toe.View.StaffView(rendEng);
        var sCtrl = new Toe.Ctrl.StaffController(sModel, sView);
        page.addStaff(sModel);

        $(neumes).each(function(nit, nel) {
            var nModel = new Toe.Model.CheironomicNeume();
            var neumeFacs = $(surface).find("zone[xml\\:id=" + $(nel).attr("facs").slice(1) + "]")[0];
            var n_bb = page.parseBoundingBox(neumeFacs);

            nModel.neumeFromMei(nel, n_bb);
            // instantiate neume view and controller
            var nView = new Toe.View.NeumeView(rendEng, page.documentType);
            var nCtrl = new Toe.Ctrl.NeumeController(nModel, nView);

            // mount neume on the staff
            sModel.addNeume(nModel, {justPush: true});
        });

        prevInd = sel+1;
    });
};
