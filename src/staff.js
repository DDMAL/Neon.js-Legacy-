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
Toe.Model.Staff = function(bb, rendEng, options) {
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

	// cache delta y: pixels between stafflines
	this.delta_y = Math.abs(this.zone.lry - this.zone.uly) / (this.props.numLines-1);

    // default c clef on line 4
    //this.clef = this.setClef(this.props.clefType, 4);

	this.neumes = new Array();
}

Toe.Model.Staff.prototype.constructor = Toe.Model.Staff;

/**
 * Sets the clef for the staff on the given staff line.
 * Enforces clef is placed within the staff
 * @param {String} clef c or f clef
 * @param {Number} staffLine staffline the clef is on
 * @param {Object} options {zone: {Array} [ulx, uly, lrx, lry]}
 */
Toe.Model.Staff.prototype.setClef = function(clefShape, staffLine, options) {
    if (staffLine > this.props.numLines) {
        throw new Error("Invalid clef position.");
    }

	var opts = {
		zone: null
	};
	$.extend(opts, options);

    this.clef = new Toe.Model.Clef(clefShape, this.rendEng, {"staffLine": staffLine});

	// set bounding box if it exists
	if (opts.zone) {
		this.clef.setBoundingBox(opts.zone);
	}
	else {
		// set top left coordinates based on staffline the clef is on
		this.clef.setBoundingBox([this.zone.ulx+this.props.clefIndent, this.zone.uly+((this.props.numLines-this.clef.props.staffLine)*this.delta_y), null, null]);
	}

    // for chaining
    return this;
}

Toe.Model.Staff.prototype.addNeumes = function(neumes) {
	for (var i = 0; i < arguments.length; i++) {
        // check argument is a neume
        if (!(arguments[i] instanceof Toe.Model.Neume)) {
            continue;
        }

        this.neumes.push(arguments[i]);
    }
	
	// for chaining
    return this;
}

Toe.Model.Staff.prototype.calcScaleFromStaff = function(clefGlyph, options) {
	var delta_y = this.zone.lry - this.zone.uly;
	var height = delta_y / (this.props.numLines-1);
 
	// clef spans 2 stafflines with 40% height (pixels) verticle buffer, 20% on each space
	height = (height * 2) - (0.65*height);

	var glyphHeight = clefGlyph.height;

	scale = Math.abs(height / glyphHeight);

	return scale;
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
Toe.Model.Staff.prototype.render = function() {
    if (!this.rendEng) {
        throw new Error("Staff: Invalid render context");
    }

    var elements = new Array();
    
    // render staff lines
    for (var li = 0; li < this.props.numLines; li++) {
        var yval = this.zone.uly+(li*this.delta_y);
        elements.push(this.rendEng.createLine([this.zone.ulx, yval, this.zone.lrx, yval], {interact: this.props.interact}));
    }
    
	this.rendEng.draw(elements, {modify: false});

    // render clef
	this.clef.setPosition([this.clef.zone.ulx, this.zone.uly+((this.props.numLines-this.clef.props.staffLine)*this.delta_y)]);
    this.clef.render();
    
	// render neumes
	var theStaff = this;
	$.each(this.neumes, function(it, el) {
		el.render(theStaff);
	});
}
