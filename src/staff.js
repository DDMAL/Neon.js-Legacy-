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
 * @requires Toe.Model.Clef
 * @requires Toe.Model.RenderEngine
 * @class Represents a Staff
 * 
 * @param {Array} bb [ulx, uly, lrx, lry] staff bounding box
 * (.) <ulx,uly>        (.)
 *
 *
 * (.)        <lrx,lry> (.)
 *
 * @param {Toe.Model.RenderEngine} rendEng drawing engine
 * @param {Object} options [numlines {Number}, clefType {String}, clefIndent (px) {Number}, interact {Boolean}]
 *
 * The staff has list of neumes on the staff
 */
Toe.Model.Staff = function(bb, options) {
    // set position
    this.zone = new Object();
    this.zone.ulx = parseInt(bb[0]);
    this.zone.uly = parseInt(bb[1]);
    this.zone.lrx = parseInt(bb[2]);
    this.zone.lry = parseInt(bb[3]);

    // default 4 stafflines
    this.props = {
        numLines: 4,
        clefType: "c",
        interact: false
    };

    $.extend(this.props, options);

    // cache delta y: pixels between stafflines
    this.delta_y = Math.abs(this.zone.lry - this.zone.uly) / (this.props.numLines-1);

    // default c clef on line 4
    //this.clef = this.setClef(this.props.clefType, 4);

    this.neumes = new Array();
}

Toe.Model.Staff.prototype.constructor = Toe.Model.Staff;

Toe.Model.Staff.prototype.setClef = function(clef) {
    if (!(clef instanceof Toe.Model.Clef)) {
        throw new Error("Staff: Invalid clef");
    }
    if (clef.props.staffLine > this.props.numLines) {
        throw new Error("Staff: Invalid clef position");
    }

    // set clef position given the staffline
    clef.setPosition([clef.zone.ulx, this.zone.uly+((this.props.numLines-clef.props.staffLine)*this.delta_y)]);

    // update view
    $(clef).trigger("vRenderClef", [clef]);
    
    this.clef = clef;

    // for chaining
    return this;
}

Toe.Model.Staff.prototype.addNeume = function(neume) {
    // check argument is a neume
    if (!(neume instanceof Toe.Model.Neume)) {
        throw new Error("Staff: Invalid neume");
    }

    // update view
    $(neume).trigger("vRenderNeume", [neume, this]);

    this.neumes.push(neume);
    
    // for chaining
    return this;
}
