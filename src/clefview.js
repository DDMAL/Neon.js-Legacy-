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

/**
 * Draws a clef on the drawing surface and updates the model's bounding box.
 * This is an internal function that is called by {@link Toe.View.ClefView#renderClef} and {@link Toe.View.ClefView#updateShape}
 * and shouldn't be called directly.
 *
 * @methodOf Toe.View.ClefView
 * @param {Toe.Model.Clef} clef The clef model
 */
Toe.View.ClefView.prototype.drawClef = function(clef) {
    if (!this.rendEng) {
        throw new Error("Clef: Invalid render context");
    }
    
    var system = clef.system;

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
    var glyphTop = system.zone.uly - clef.props.systemPos*system.delta_y/2;
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
 * Renders the clef on the canvas. Calls {@link Toe.View.ClefView#drawClef}.
 *
 * @methodOf Toe.View.ClefView
 * @param {Toe.Model.Clef} clef The clef to render.
 */
Toe.View.ClefView.prototype.renderClef = function(clef) {
    this.drawClef(clef);
}

/**
 * Renders the bounding box of the clef on the canvas
 *
 * @methodOf Toe.View.ClefView
 * @param {Toe.Model.Clef} clef The clef to render the bounding box
 */
Toe.View.ClefView.prototype.renderClefBoundingBox = function(clef) {
    var c_bb = [clef.zone.ulx, clef.zone.uly, clef.zone.lrx, clef.zone.lry];
    this.rendEng.outlineBoundingBox(c_bb, {fill: "red"});
}

/**
 * Updates the shape of a clef on the drawing surface.
 * For example, changing from a "C" to an "F" clef.
 *
 * @methodOf Toe.View.ClefView
 * @param {Toe.Model.Clef} clef The clef to render.
 */
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

/**
 * Updates the vertical position of a clef on the drawing surface.
 *
 * @methodOf Toe.View.ClefView
 * @param {Toe.Model.Clef} clef The clef whose system position is to be modified.
 */
Toe.View.ClefView.prototype.updateSystemPosition = function(clef) {
    if (!this.drawing) {
        throw new Error("Clef: update method called, but there exists no drawing to update.");
    }

    var glyphTop = clef.system.zone.uly - clef.props.systemPos*clef.system.delta_y/2;
    if (clef.shape == "f") {
        // 0.34 is the relative position of the f clef glyph placement
        glyphTop += 0.34*this.drawing.currentHeight/2;
    }

    this.drawing.top = glyphTop;

    this.rendEng.repaint();

    // update model
    $(clef).trigger("mUpdateBoundingBox", this.drawing);
}

/**
 * Selects the clef on the drawing surface.
 *
 * @methodOf Toe.View.ClefView
 */
Toe.View.ClefView.prototype.selectDrawing = function() {
    this.rendEng.canvas.setActiveObject(this.drawing);
}
