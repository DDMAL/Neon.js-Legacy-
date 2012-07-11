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
 * Creates a new clef view
 *
 * @class View for the clef
 * @param {Toe.View.RenderEngine} renderEngine The rendering engine
 */
Toe.View.ClefView = function(renderEngine) {
    this.rendEng = renderEngine;

    this.drawing = null;
}

Toe.View.ClefView.prototype.constructor = Toe.View.ClefView;

Toe.View.ClefView.prototype.drawClef = function(clef) {
    if (!this.rendEng) {
        throw new Error("Clef: Invalid render context");
    }
    
    var staff = clef.staff;

    var svgKey = null;
    switch(clef.shape) {
        case "c":
            svgKey = "c_clef";
            break;
        case "f":
            svgKey = "f_clef";
            break;
    }

    var cGlyph = this.rendEng.getGlyph(svgKey);
    var glyphLeft = clef.zone.ulx + cGlyph.centre[0];
    var glyphTop = staff.zone.uly - clef.props.staffPos*staff.delta_y/2;
     if (clef.shape == "f") {
        // 0.34 is the relative position of the f clef glyph placement
        glyphTop += 0.34*cGlyph.centre[1];
    }

    var svgClef = cGlyph.clone().set({left: glyphLeft, top: glyphTop}); // offset centre

    this.drawing = this.rendEng.draw({fixed: [], modify: [svgClef]}, {selectable: clef.props.interact, group: true, eleRef: clef})[0];

    // update model
    $(clef).trigger("mUpdateBoundingBox", this.drawing);
}

/**
 * Renders the clef
 * @methodOf Toe.View.ClefView
 * @param {Toe.Model.Clef} clef Clef to render
 */
Toe.View.ClefView.prototype.renderClef = function(clef) {
    this.drawClef(clef);
}

Toe.View.ClefView.prototype.updateShape = function(clef) {
    if (!this.drawing) {
        throw new Error("Clef: update method called, but there exists no drawing to update.");
    }
    else {
        // remove the old drawing
        this.rendEng.canvas.remove(this.drawing);
    }

    this.drawClef(clef);

    // select the new drawing
    this.selectDrawing();

    this.rendEng.repaint();
}

Toe.View.ClefView.prototype.updateStaffPosition = function(clef) {
    if (!this.drawing) {
        throw new Error("Clef: update method called, but there exists no drawing to update.");
    }

    var glyphTop = clef.staff.zone.uly - clef.props.staffPos*clef.staff.delta_y/2;
    if (clef.shape == "f") {
        // 0.34 is the relative position of the f clef glyph placement
        glyphTop += 0.34*this.drawing.currentHeight/2;
    }

    this.drawing.top = glyphTop;

    this.rendEng.repaint();

    // update model
    $(clef).trigger("mUpdateBoundingBox", this.drawing);
}

Toe.View.ClefView.prototype.selectDrawing = function() {
    this.rendEng.canvas.setActiveObject(this.drawing);
}
