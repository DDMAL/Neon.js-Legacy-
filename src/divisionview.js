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
 * Creates a new division view
 *
 * @class View for the division
 * @param {Toe.View.RenderEngine} renderEngine The rendering engine
 */
Toe.View.DivisionView = function(renderEngine) {
    this.rendEng = renderEngine;
}

Toe.View.DivisionView.prototype.constructor = Toe.View.DivisionView;

/**
 * Renders the division on the staffs
 *
 * @methodOf Toe.View.DivisionView
 * @param {Toe.Model.Division} division Division to render
 * @param {Toe.Model.Staff} staff Staff context in which to render the provided division
 */
Toe.View.DivisionView.prototype.renderDivision = function(division, staff) {
    if (!this.rendEng) {
        throw new Error("Division: Invalid render context");
    }

    var elements = {static: new Array(), modify: new Array()};
    
    // render division lines
    var x1 = division.zone.ulx;
    var divProps = {strokeWidth: 4};
    switch (division.type) {
        case Toe.Model.Division.Type.small:
            var y1 = staff.zone.uly - staff.delta_y/2;
            var y2 = staff.zone.uly + staff.delta_y/2;
            elements.static.push(this.rendEng.createLine([x1, y1, x1, y2], divProps));
            break;

        case Toe.Model.Division.Type.minor:
            var y1 = staff.zone.uly + staff.delta_y/2;
            var y2 = y1 + 2*staff.delta_y;
            elements.static.push(this.rendEng.createLine([x1, y1, x1, y2], divProps));
            break;

        case Toe.Model.Division.Type.major:
            var y1 = staff.zone.uly;
            var y2 = staff.zone.lry;
            elements.static.push(this.rendEng.createLine([x1, y1, x1, y2], divProps));
            break;

        case Toe.Model.Division.Type.final:
            var y1 = staff.zone.uly;
            var y2 = staff.zone.lry;
            elements.static.push(this.rendEng.createLine([x1, y1, x1, y2], divProps));

            var x2 = division.zone.lrx;
            elements.static.push(this.rendEng.createLine([x2, y1, x2, y2], divProps));
            break;
    }
    
	this.rendEng.draw(elements, {group: true, selectable: division.props.interact, staffRef: staff, eleRef: division});
}
