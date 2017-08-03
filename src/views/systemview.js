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
 * Creates a new system view
 *
 * @class View for the system
 * @param {Toe.View.RenderEngine} renderEngine The rendering engine
 */
Toe.View.SystemView = function(renderEngine) {
    this.rendEng = renderEngine;
    this.drawing = null;
};

Toe.View.SystemView.prototype = new Toe.View.View();
Toe.View.SystemView.prototype.constructor = Toe.View.SystemView;

/**
 * Renders the system according to the following scheme:
 *  <ulx,uly> =======
 *            ------- (line numLines)
 *            ------- (line numLines-1)
 *            ------- ...
 *            ------- (line 1)
 *            ======= <lrx,lry>
 * 
 * @methodOf Toe.View.SystemView
 * @param {Toe.Model.System} aSystem system to render
 */
Toe.View.SystemView.prototype.renderSystem = function(aSystem) {
    if (!this.rendEng) {
        throw new Error("Toe.View.SystemView: Invalid render context");
    }

    var elements = {fixed: [], modify: []};

    // render lines
    for (var li = 0; li < aSystem.props.numLines; li++) {
        var yval = aSystem.zone.uly+(li*aSystem.delta_y);
        elements.fixed.push(this.rendEng.createLine([aSystem.zone.ulx, yval, aSystem.zone.lrx, yval]));
    }
    
	this.drawing = this.rendEng.draw(elements, {selectable: aSystem.props.interact,
                                     group: aSystem.props.group,
                                     eleRef: aSystem,
                                     lockMovementX: true,
                                     lockMovementY: true,
                                     hasControls: true,
                                     lockScalingX: false,
                                     lockScalingY: true,
                                     lockRotation: true,
                                     lockUniScaling: false});
};

/**
 * Renders the bounding box of the system
 *
 * @methodOf Toe.View.SystemView
 * @param {Toe.Model.System} aSystem system to render the bounding box
 */
Toe.View.SystemView.prototype.renderSystemBoundingBox = function(aSystem) {
    var s_bb = [aSystem.zone.ulx, aSystem.zone.uly, aSystem.zone.lrx, aSystem.zone.lry];
    this.rendEng.outlineBoundingBox(s_bb, {fill: "blue"});
};
