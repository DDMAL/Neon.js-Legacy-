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
 * Creates a staff
 * @requires Toe
 * @requires Toe.Clef
 * @requires Toe.RenderEngine
 * @class Represents a Staff
 * 
 * @param {Array} bb [ulx, uly, lrx, lry] staff bounding box
 * (.) <ulx,uly>        (.)
 *
 *
 * (.)        <lrx,lry> (.)
 *
 * @param {Toe.RenderEngine} rendEng drawing engine
 * @param {Object} options [numlines {Number}, clefType {String}, clefIndent (px) {Number}, interact {Boolean}]
 *
 * The staff has list of neumes on the staff
 */
Toe.Staff = function(bb, rendEng, options) {
    // set position
    this.zone = new Object();
    this.zone.ulx = parseInt(bb[0]);
    this.zone.uly = parseInt(bb[1]);
    this.zone.lrx = parseInt(bb[2]);
    this.zone.lry = parseInt(bb[3]);

    this.rendEng = rendEng;

    // default 4 stafflines
    this.props = {
        numLines: 4,
        clefType: "c",
        clefIndent: 5,   // in px
        interact: false
    };

    $.extend(this.props, options);

    // default c clef on line 2
    this.clef = new Toe.Clef(this.props.clefType, this.rendEng);

	this.neumes = new Array();
}

Toe.Staff.prototype.constructor = Toe.Staff;

/**
 * Sets the clef for the staff on the given staff line
 * @param {String} clef c or f clef
 * @param {Number} staffLine staffline the clef is on
 */
Toe.Staff.prototype.setClef = function(clef, staffLine) {
    if (staffLine > this.props.numLines) {
        throw new Error("Invalid clef position.");
    }

    this.clef = new Toe.Clef(clef, this.rendEng, {"staffLine": staffLine});

    // for chaining
    return this;
}

Toe.Staff.prototype.addNeumes = function(neumes) {
	for (var i = 0; i < arguments.length; i++) {
        // check argument is a neume
        if (!(arguments[i] instanceof Toe.Neume)) {
            continue;
        }

        this.neumes.push(arguments[i]);
    }
	
	// for chaining
    return this;
}

/**
 * Renders the staff according to the following scheme:
 *  <ulx,uly> =======
 *            ------- (line numLines)
 *            ------- (line numLines-1)
 *            ------- ...
 *            ------- (line 1)
 *            ======= <lrx,lry>
 */
Toe.Staff.prototype.render = function() {
    if (!this.rendEng) {
        throw new Error("Staff: Invalid render context");
    }

    var elements = new Array();
    
    var delta_y = Math.abs(this.zone.lry - this.zone.uly);
    var partition = delta_y / (this.props.numLines+1);

    // render staff lines
    for (var li = 1; li <= this.props.numLines; li++) {
        var yval = this.zone.uly+(li*partition);
        elements.push(this.rendEng.createLine([this.zone.ulx, yval, this.zone.lrx, yval], this.props.interact));
    }
    
    // render clef
    this.clef.setPosition([this.zone.ulx+this.props.clefIndent, this.zone.uly+((this.props.numLines-this.clef.props.staffLine+1)*partition)]);
    this.clef.render();    
        
    this.rendEng.draw(elements, false);
}
