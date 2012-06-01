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
 *
 * @class Represents a clef
 * @param {String} clefShape clef shape: c or f
 * @param {Object} options staffline {Number}, interact {Boolean}
 */
Toe.Model.Clef = function(clefShape, options) {
    this.shape = clefShape.toLowerCase();
    this.name = Toe.Model.Clef.Type[this.shape];

    var clefPos = null;
    if (this.name == undefined) {
        throw new Error("Clef: undefined clef type: '" + clefShape + "'");
    }
    else if (clefShape == "c") {
        // default staffline from pp. 17 Liber Usualis
        clefPos = 0;
    }
    else if (clefShape == "f") {
        // default staffline from pp. 17 Liber Usualis
        clefPos = 2;
    }

    this.props = {
        staffPos: clefPos,
        interact: true
    };

    $.extend(this.props, options);

    // initialize bounding box
    this.zone = new Object();
}

/**
 * Known clef types
 *
 * @constant
 * @public
 * @fieldOf Toe.Model.Clef
 */
Toe.Model.Clef.Type = {
    c: "Doh Clef",
    f: "Fah Clef"
};

Toe.Model.Clef.prototype.constructor = Toe.Model.Clef;

/**
 * Sets the id of the clef
 *
 * @methodOf Toe.Model.Clef
 * @ param {String} cid clef id
 */
Toe.Model.Clef.prototype.setID = function(cid) {
    this.id = cid;
}

/**
 * Sets the position of the clef
 *
 * @methodOf Toe.Model.Clef
 * @param pos {Array} [x,y]
 */
Toe.Model.Clef.prototype.setPosition = function(pos) {
    this.x = pos[0];
    this.y = pos[1];
}

/**
 * Sets the bounding box of the clef
 *
 * @methodOf Toe.Model.Clef
 * @param {Array} bb [ulx, uly, lrx, lry]
 */
 Toe.Model.Clef.prototype.setBoundingBox = function(bb) {
    if(!Toe.validBoundingBox(bb)) {
        throw new Error("Clef: invalid bounding box");
    }

    this.zone.ulx = bb[0];
    this.zone.uly = bb[1];
    this.zone.lrx = bb[2];
    this.zone.lry = bb[3];
}
