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
 * Creates a clef
 * @requires Toe
 * @requires Toe.RenderEngine
 * @class Represents a clef
 * @param {String} clefType clef type: c or f
 * @param {Toe.RenderEngine} drawing engine
 * @param {Object} options staffline {Number}, interact {Boolean}
 */
Toe.Clef = function(clefType, rendEng, options) {
    clefType = clefType.toLowerCase();

    this.clefInfo = Toe.Clef.types[clefType];
	var clefLine = null;
    if (this.clefInfo == undefined) {
        throw new Error("Clef: undefined clef type: '" + clefType + "'");
    }
	else if (clefType == "c") {
		// default staffline from pp. 17 Liber Usualis
		clefLine = 4;
	}
	else if (clefType == "f") {
		// default staffline from pp. 17 Liber Usualis
		clefLine = 3;
	}

    this.rendEng = rendEng;

    this.props = {
        staffLine: clefLine,
        interact: false
    };

    $.extend(this.props, options);

	// initialize bounding box
    this.zone = new Object();
}

/**
 * Types of clefs and their lookup keys
 * @constant
 */
Toe.Clef.types = {
    "c": {
		name: "Doh Clef",
        svgKey: "c_clef"
    },
    "f": {
		name: "Fah Clef",
        svgKey: "f_clef"
    }
};

Toe.Clef.prototype.constructor = Toe.Clef;

/**
 * @param pos {Array} [x,y]
 */
Toe.Clef.prototype.setPosition = function(pos) {
	this.x = pos[0];
	this.y = pos[1];
}

// [ulx, uly, lrx, lry]
Toe.Clef.prototype.setBoundingBox = function(bb) {
    this.zone.ulx = bb[0];
    this.zone.uly = bb[1];
    this.zone.lrx = bb[2];
    this.zone.lry = bb[3];
}

/**
 * Renders the clef on the canvas
 */
Toe.Clef.prototype.render = function() {
    if (!this.rendEng) {
        throw new Error("Clef: Invalid render context");
    }

    var clef = this.rendEng.getGlyph(this.clefInfo.svgKey);
	console.log(clef);
    var glyphClef = clef.clone().set({left: this.x+(clef.obj.width*this.rendEng.options.globScale/2), top: this.y}); // offset centre
    glyphClef.selectable = this.props.interact;

    this.rendEng.draw([glyphClef], true);
}
