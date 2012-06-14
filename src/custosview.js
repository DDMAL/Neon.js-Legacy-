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
}

Toe.View.CustosView.prototype.constructor = Toe.View.CustosView;

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
    var custosDwg = glyphCustos.clone().set({left: custos.zone.ulx + glyphCustos.centre[0], top: custos_y - glyphCustos.centre[1]/2});

	this.drawing = this.rendEng.draw({static: [], modify: [custosDwg]}, {selectable: custos.props.interact, eleRef: custos})[0];
}

Toe.View.CustosView.prototype.updateStaffPosition = function(custos) {
    if (!this.drawing) {
        throw new Error("Custos: update method called, but there exists no drawing to update.");
    }

    var staff = custos.staff;

    var glyphTop = staff.zone.uly - custos.rootStaffPos*staff.delta_y/2 - this.drawing.currentHeight/4;
    this.drawing.set({top: glyphTop});

    this.rendEng.repaint();

    // update model
    $(custos).trigger("mUpdateBoundingBox", this.drawing);
}

Toe.View.CustosView.prototype.eraseDrawing = function() {
    this.rendEng.canvas.remove(this.drawing);
    this.drawing = null;

    this.rendEng.repaint();
}

Toe.View.CustosView.prototype.selectDrawing = function() {
    this.rendEng.canvas.setActiveObject(this.drawing);
}
