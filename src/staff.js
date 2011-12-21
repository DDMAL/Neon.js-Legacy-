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
 * @class Represents a Staff
 * 
 * bounding box:
 * (.) <ulx,uly>        (.)
 *
 *
 * (.)        <lrx,lry> (.)
 */
Toe.Staff = function(bb, rendEng, options) {
    // set position
    this.zone = new Object();
    this.zone.ulx = bb[0];
    this.zone.uly = bb[1];
    this.zone.lrx = bb[2];
    this.zone.lry = bb[3];

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
}

Toe.Staff.prototype.constructor = Toe.Staff;

Toe.Staff.prototype.setClef = function(clef, staffLine) {
    if (staffLine > this.props.numLines) {
        throw new Error("Invalid clef position.");
    }

    this.clef = new Toe.Clef(clef, this.rendEng, {"staffLine": staffLine});

    // for chaining
    return this;
}

/**
 *  <ulx,uly> =======
 *            ------- (line 1)
 *            ------- (line 2)
 *            ------- ...
 *            ------- (line numLines)
 *            ======= <lrx,lry>
 */
Toe.Staff.prototype.render = function() {
    if (!this.rendEng) {
        throw new Error("Staff: Invalid render context");
    }

    // private helper function
    var makeStaffLine = function(coords, interact) {
        return new fabric.Line(coords, {
            fill: 'black',
            strokeWidth: 1,
            selectable: interact
        });
    }

    var elements = new Array();
    
    var delta_y = Math.abs(this.zone.lry - this.zone.uly);
    var partition = delta_y / (this.props.numLines+1);

    // render staff lines
    for (var li = 1; li <= this.props.numLines; li++) {
        var yval = this.zone.uly+(li*partition);
        elements.push(makeStaffLine([this.zone.ulx, yval, this.zone.lrx, yval], this.props.interact));
    }
    
    // render clef
    this.clef.setPosition([this.zone.ulx+this.props.clefIndent, this.zone.uly+(this.clef.props.staffLine*partition)]);
    this.clef.render();    
        
    this.rendEng.draw(elements, false);
}
