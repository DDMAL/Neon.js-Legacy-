/*
Copyright (C) 2011-2013 by Gregory Burlet, Alastair Porter

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
 * A music score in square note notation. 
 *
 * @class Represents a page of music in square note notation. 
 * @extends Toe.Model.Page
 */
Toe.Model.SquareNotePage = function(documentType) {
    this.documentType = documentType;
};

// inherit prototype from page object
Toe.Model.SquareNotePage.prototype = new Toe.Model.Page();
Toe.Model.SquareNotePage.prototype.constructor = Toe.SquareNotePage;

/**
 * Loads the page of music from an MEI file. The render engine is required
 * as a parameter because the glyph scaling factor is derived from the
 * size of the first system that is loaded in this function.
 *
 * @methodOf Toe.Model.SquareNotePage
 * @param {Toe.View.RenderEngine} rendEng the rendering engine
 */
Toe.Model.SquareNotePage.prototype.loadMei = function(mei, rendEng) {
    // cache page reference
    var page = this;

    // Get the actual "page" element.
    var pageId = $($(mei).find("page")[0]).attr("xml:id");
    this.setID(pageId);

    var surface = $(mei).find("surface")[0];
    var clefList = $("clef, sb", mei);
    // calculate sb indices in the clef list
    var clef_sbInd = new Array();
    $(clefList).each(function(cit, cel) {
        if ($(cel).is("sb")) {
            clef_sbInd.push(cit);
        }
    });

    var neumeList = $("neume, sb", mei);
    // calculate sb indices in the neume list
    // precomputing will render better performance than a filter operation in the loops
    var neume_sbInd = new Array();
    $(neumeList).each(function(nit, nel)  {
        if ($(nel).is("sb")) {
            neume_sbInd.push(nit);
        }
    });

    var divList = $("division, sb", mei);
    // calculate sb indices in the division list
    var div_sbInd = new Array();
    $(divList).each(function(dit, del) {
        if ($(del).is("sb")) {
            div_sbInd.push(dit);
        }
    });

    var custosList = $("custos, sb", mei);
    // calculate sb indices in the custos list
    var custos_sbInd = new Array();
    $(custosList).each(function(cit, cel) {
        if ($(cel).is("sb")) {
            custos_sbInd.push(cit);
        }
    });

    // for each system
    $("sb", mei).each(function(sit, sel) {
        // get facs data
        //var sbref = $(sel).attr("systemref");
        var sysfacsid = $(sel).attr("facs");
        var sysFacs = $(surface).find("zone[xml\\:id=" + sysfacsid + "]")[0];

        // create system
        var s_bb = page.parseBoundingBox(sysFacs);

        // Set some parameters.
        var sModel = new Toe.Model.SquareNoteSystem(s_bb);
        sModel.setID($(sel).attr("xml:id"));
        sModel.setOrderNumber(parseInt($(sel).attr("n")));
        sModel.setSystemID($(sel).attr("xml:id"));

        // set global scale using system from first system
        if (sit == 0) {
            rendEng.calcScaleFromSystem(sModel, {overwrite: true});
        }

        // instantiate system view and controller
        var sView = new Toe.View.SystemView(rendEng);
        var sCtrl = new Toe.Ctrl.SystemController(sModel, sView);
        page.addSystem(sModel);

        // load all clefs in the system
        $(clefList).slice(clef_sbInd[sit]+1, clef_sbInd[sit+1]).each(function(cit, cel) {
            var clefShape = $(cel).attr("shape");
            var clefSystemLine = parseInt($(cel).attr("line"));

            // convert mei line attribute to systemPos attribute used in the internal clef Model
            var systemPos = -(sModel.props.numLines - clefSystemLine) * 2;

            var clefFacsId = $(cel).attr("facs");
            var clefFacs = $(surface).find("zone[xml\\:id=" + clefFacsId + "]")[0];
            var c_bb = page.parseBoundingBox(clefFacs);

            var cModel = new Toe.Model.Clef(clefShape, {"systemPos": systemPos});
            cModel.setID($(cel).attr("xml:id"));
            cModel.setBoundingBox(c_bb);

            // instantiate clef view and controller
            var cView = new Toe.View.ClefView(rendEng);
            var cCtrl = new Toe.Ctrl.ClefController(cModel, cView);

            // mount clef on the system
            sModel.addClef(cModel);
        });

        // load all neumes in the system
        $(neumeList).slice(neume_sbInd[sit]+1, neume_sbInd[sit+1]).each(function(nit, nel) {
            var nModel = new Toe.Model.SquareNoteNeume();
            var neumeFacs = $(surface).find("zone[xml\\:id=" + $(nel).attr("facs") + "]")[0];
            var n_bb = page.parseBoundingBox(neumeFacs);

            nModel.neumeFromMei(nel, n_bb);
            // instantiate neume view and controller
            var nView = new Toe.View.NeumeView(rendEng, page.documentType);
            var nCtrl = new Toe.Ctrl.NeumeController(nModel, nView);

            // mount neume on the system
            sModel.addNeume(nModel);
        });

        // load all divisions in the system
        $(divList).slice(div_sbInd[sit]+1, div_sbInd[sit+1]).each(function(dit, del) {
            var divFacs = $(surface).find("zone[xml\\:id=" + $(del).attr("facs") + "]")[0];
            var d_bb = page.parseBoundingBox(divFacs);

            var dType = "div_" + $(del).attr("form");
            var dModel = new Toe.Model.Division(dType);
            dModel.setBoundingBox(d_bb);
            dModel.setID($(del).attr("xml:id"));

            // instantiate division view and controller
            var dView = new Toe.View.DivisionView(rendEng);
            var dCtrl = new Toe.Ctrl.DivisionController(dModel, dView);

            // mount the division on the system
            sModel.addDivision(dModel);
        });

        // load custos for the system (if it exists)
        $(custosList).slice(custos_sbInd[sit]+1, custos_sbInd[sit+1]).each(function(cit, cel) {
            var custosFacs = $(surface).find("zone[xml\\:id=" + $(cel).attr("facs") + "]")[0];
            var c_bb = page.parseBoundingBox(custosFacs);

            // get pitch name and octave
            var pname = $(cel).attr("pname");
            var oct = parseInt($(cel).attr("oct"));

            var cModel = new Toe.Model.Custos(pname, oct);
            cModel.setBoundingBox(c_bb);
            cModel.setID($(cel).attr("xml:id"));

            // instantiate division view and controller
            var cView = new Toe.View.CustosView(rendEng);
            var cCtrl = new Toe.Ctrl.CustosController(cModel, cView);

            // mount the custos on the system
            sModel.setCustos(cModel);
        });
    });
};
