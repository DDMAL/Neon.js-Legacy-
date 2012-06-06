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
}

Toe.View.ClefView.prototype.constructor = Toe.View.ClefView;

/**
 * Renders the clef
 * @methodOf Toe.View.ClefView
 * @param {Toe.Model.Clef} clef Clef to render
 */
Toe.View.ClefView.prototype.renderClef = function(clef) {
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
    var glyphTop = staff.zone.uly + clef.props.staffPos*staff.delta_y/2;
     if (clef.shape == "f") {
        // 0.34 is the relative position of the f clef glyph placement
        glyphTop += 0.34*cGlyph.centre[1];
    }

    var svgClef = cGlyph.clone().set({left: glyphLeft, top: glyphTop}); // offset centre

    this.drawing = this.rendEng.draw({static: [], modify: [svgClef]}, {group: true, selectable: clef.props.interact, staffRef: staff, eleRef: clef})[0];

    // update model
    $(clef).trigger("mUpdateBoundingBox", this.drawing);
}

Toe.View.ClefView.prototype.updateShape = function(clef) {
    if (!this.drawing) {
        throw new Error("Clef: update method called, but there exists no drawing to update.");
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

    // remove the old clef drawing from the canvas surface
    this.rendEng.canvas.remove(this.drawing);

    var cGlyph = this.rendEng.getGlyph(svgKey);
    var glyphLeft = staff.zone.ulx;
    var glyphTop = staff.zone.uly + clef.props.staffPos*staff.delta_y/2;
    if (clef.shape == "c") {
        glyphLeft += cGlyph.centre[0];
    }
    else if (clef.shape == "f") {
        // 0.34 is the relative position of the f clef glyph placement
        glyphTop += 0.34*cGlyph.centre[1];
    }

    var svgClef = cGlyph.clone().set({left: glyphLeft, top: glyphTop});

    this.drawing = this.rendEng.draw({static: [], modify: [svgClef]}, {group: true, selectable: clef.selectable, staffRef: clef.staff, eleRef: clef, repaint: true})[0];

    // update model
    $(clef).trigger("mUpdateBoundingBox", this.drawing);
}

Toe.View.ClefView.prototype.updateStaffPosition = function(clef) {
    if (!this.drawing) {
        throw new Error("Clef: update method called, but there exists no drawing to update.");
    }

    var staff = clef.staff;

    var glyphTop = staff.zone.uly + clef.props.staffPos*staff.delta_y/2;
    if (clef.shape == "f") {
        // 0.34 is the relative position of the f clef glyph placement
        glyphTop += 0.34*this.drawing.currentHeight/2;
    }

    this.drawing.top = glyphTop;

    // update model
    $(clef).trigger("mUpdateBoundingBox", this.drawing);
}
