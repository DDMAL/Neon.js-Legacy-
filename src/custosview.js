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
 * Creates a new custos view
 *
 * @class View for the custos
 * @param {Toe.View.RenderEngine} renderEngine The rendering engine
 */
Toe.View.CustosView = function(renderEngine) {
    this.rendEng = renderEngine;

    this.drawing = null;
    this.ledgerLines = null;
}

Toe.View.CustosView.prototype.constructor = Toe.View.CustosView;

Toe.View.CustosView.prototype.drawLedgerLines = function(staffPos, centre, width, staff) {
    width *= 0.75;

    var cv = this;
    var ledgers = new Array();
    var bottomStaffPos = 2*(1-staff.props.numLines);
    if (staffPos > 0) {
        for (var i = 0; i <= staffPos; i += 2) {
            var line_y = staff.zone.uly - (i*staff.delta_y/2);
            ledgers.push(cv.rendEng.createLine([centre-width, line_y, centre+width, line_y]));
        }
    }
    else if (staffPos < bottomStaffPos) {
        for (var i = bottomStaffPos; i >= staffPos; i -= 2) {
            var line_y = staff.zone.uly - (i*staff.delta_y/2);
            ledgers.push(cv.rendEng.createLine([centre-width, line_y, centre+width, line_y]));
        }
    }

    this.ledgerLines = this.rendEng.draw({fixed: ledgers, modify: []}, {group: true, selectable: false})[0];
}

/**
 * Renders the custos on the staffs
 *
 * @methodOf Toe.View.CustosView
 * @param {Toe.Model.Custos} custos Custos to render
 */
Toe.View.CustosView.prototype.renderCustos = function(custos) {
    if (!this.rendEng) {
        throw new Error("Custos: Invalid render context");
    }

    // get the staff this custos is mounted on
    var staff = custos.staff;

    var glyphCustos = this.rendEng.getGlyph("custos");

    // calculate the y position of the custos
    var custos_y = staff.zone.uly - custos.rootStaffPos*staff.delta_y/2;
    var nc_x = custos.zone.ulx + glyphCustos.centre[0];
    var custosDwg = glyphCustos.clone().set({left: nc_x, top: custos_y - glyphCustos.centre[1]/2});

    this.drawLedgerLines(custos.rootStaffPos, nc_x, 4*glyphCustos.centre[0], staff);
	this.drawing = this.rendEng.draw({fixed: [], modify: [custosDwg]}, {selectable: custos.props.interact, group: true, lockMovementX: true, lockMovementY: true, eleRef: custos})[0];
}

Toe.View.CustosView.prototype.updateStaffPosition = function(custos) {
    if (!this.drawing) {
        throw new Error("Custos: update method called, but there exists no drawing to update.");
    }
    if (this.ledgerLines) {
        this.rendEng.canvas.remove(this.ledgerLines);
        this.ledgerLines = null;
    }

    var staff = custos.staff;

    var glyphTop = staff.zone.uly - custos.rootStaffPos*staff.delta_y/2 - this.drawing.currentHeight/4;
    this.drawing.top = glyphTop;

    this.drawLedgerLines(custos.rootStaffPos, this.drawing.left, (3/2)*this.drawing.currentWidth, staff);

    this.rendEng.repaint();

    // update model
    $(custos).trigger("mUpdateBoundingBox", this.drawing);
}

Toe.View.CustosView.prototype.eraseDrawing = function() {
    if (this.drawing) {
        this.rendEng.canvas.remove(this.drawing);
    }
    if (this.ledgerLines) {
        this.rendEng.canvas.remove(this.ledgerLines);
        this.ledgerLines = null;
    }

    this.rendEng.repaint();
}

Toe.View.CustosView.prototype.selectDrawing = function() {
    this.rendEng.canvas.setActiveObject(this.drawing);
}
