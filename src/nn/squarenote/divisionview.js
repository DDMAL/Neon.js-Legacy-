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
 * Creates a new division view
 *
 * @class View for the division
 * @param {Toe.View.RenderEngine} renderEngine The rendering engine
 */
Toe.View.DivisionView = function(renderEngine) {
    this.rendEng = renderEngine;
};

Toe.View.DivisionView.prototype = new Toe.View.View();
Toe.View.DivisionView.prototype.constructor = Toe.View.DivisionView;

/**
 * Renders the division on the systems
 *
 * @methodOf Toe.View.DivisionView
 * @param {Toe.Model.Division} division Division to render
 */
Toe.View.DivisionView.prototype.renderDivision = function(division) {
    if (!this.rendEng) {
        throw new Error("Division: Invalid render context");
    }

    var system = division.system;

    var elements = {fixed: new Array(), modify: new Array()};
    
    // render division lines
    var x1 = division.zone.ulx;
    var divProps = {strokeWidth: 4};
    switch (division.type) {
        case Toe.Model.Division.Type.div_small:
            var y1 = system.zone.uly - system.delta_y/2;
            var y2 = system.zone.uly + system.delta_y/2;
            elements.fixed.push(this.rendEng.createLine([x1, y1, x1, y2], divProps));
            break;

        case Toe.Model.Division.Type.div_minor:
            var y1 = system.zone.uly + system.delta_y/2;
            var y2 = y1 + 2*system.delta_y;
            elements.fixed.push(this.rendEng.createLine([x1, y1, x1, y2], divProps));
            break;

        case Toe.Model.Division.Type.div_major:
            var y1 = system.zone.uly;
            var y2 = system.zone.lry;
            elements.fixed.push(this.rendEng.createLine([x1, y1, x1, y2], divProps));
            break;

        case Toe.Model.Division.Type.div_final:
            var y1 = system.zone.uly;
            var y2 = system.zone.lry;
            elements.fixed.push(this.rendEng.createLine([x1, y1, x1, y2], divProps));

            var x2 = division.zone.lrx;
            elements.fixed.push(this.rendEng.createLine([x2, y1, x2, y2], divProps));
            break;
    }
    
	this.drawing = this.rendEng.draw(elements, {group: true, selectable: division.props.interact, eleRef: division})[0];
}

/**
 * Render the bounding box of the division
 *
 * @methodOf Toe.View.DivisionView
 * @param {Toe.Model.Division} division Division to render the bounding box
 */
Toe.View.DivisionView.prototype.renderBoundingBox = function(division) {
    var d_bb = [division.zone.ulx, division.zone.uly, division.zone.lrx, division.zone.lry];
    this.rendEng.outlineBoundingBox(d_bb, {fill: "yellow"});
}

Toe.View.DivisionView.prototype.selectDrawing = function() {
this.rendEng.canvas.setActiveObject(this.drawing);
}

/**
 * To update the shape when editing division type
 *
 * @param division to update the shape of
 */
Toe.View.DivisionView.prototype.updateShape = function(division) {
    if (!this.drawing) {
        throw new Error("Division: update method called, but there exists no drawing to update.");
    }
    else {
        // remove the old drawing
        this.rendEng.canvas.remove(this.drawing);
    }

    this.renderDivision(division);

    // select the new drawing
    this.selectDrawing();

    this.rendEng.repaint();
}
