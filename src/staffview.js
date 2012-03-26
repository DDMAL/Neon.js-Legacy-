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
 * Creates a new staff view
 *
 * @class View for the staff
 * @param {Toe.View.RenderEngine} renderEngine The rendering engine
 */
Toe.View.StaffView = function(renderEngine) {
    this.rendEng = renderEngine;
}

Toe.View.StaffView.prototype.constructor = Toe.View.StaffView;

/**
 * Renders the staff according to the following scheme:
 *  <ulx,uly> =======
 *            ------- (line numLines)
 *            ------- (line numLines-1)
 *            ------- ...
 *            ------- (line 1)
 *            ======= <lrx,lry>
 * 
 * @methodOf Toe.View.StaffView
 * @param {Toe.Model.Staff} staff Staff to render
 */
Toe.View.StaffView.prototype.renderStaff = function(staff) {
    if (!this.rendEng) {
        throw new Error("Staff: Invalid render context");
    }

    var elements = {static: new Array(), modify: new Array()};

    // render staff lines
    for (var li = 0; li < staff.props.numLines; li++) {
        var yval = staff.zone.uly+(li*staff.delta_y);
        elements.static.push(this.rendEng.createLine([staff.zone.ulx, yval, staff.zone.lrx, yval]));
    }
    
	this.rendEng.draw(elements, {selectable: staff.props.interact});
}
