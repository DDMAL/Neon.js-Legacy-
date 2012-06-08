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

    if (this.name == undefined) {
        throw new Error("Clef: unknown clef shape");
    }

    var clefPos = null;
    if (clefShape == "c") {
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

    // reference to the staff this clef is mounted on
    this.staff = null;
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

Toe.Model.Clef.prototype.setStaff = function(staff) {
    if (!(staff instanceof Toe.Model.Staff)) {
        throw new Error("Clef: invalid staff reference");
    }

    this.staff = staff;
}

/**
 * Sets the shape of the clef
 *
 * @methodOf Toe.Model.clef
 * @param {String} shape the new clef shape
 */
Toe.Model.Clef.prototype.setShape = function(shape) {
    this.shape = shape.toLowerCase();
    this.name = Toe.Model.Clef.Type[this.shape];

    if (this.name == undefined) {
        throw new Error("Clef: unknown clef shape");
    }

    // update affected pitched elements on the staff
    this.staff.updatePitchedElements({clef: this});

    $(this).trigger("vUpdateShape", [this]);
}

/**
 * Sets the position on the staff according to the following scheme:
 *
 *  <ulx,uly> =======
 *            ------- 0
 *            ------- -2
 *            ------- ...
 *            ------- -(numlines x 2)
 *            ======= <lrx,lry>
 * 
 * @methodOf Toe.Model.Clef
 * @param {Number} staffPos new staff position
 */
Toe.Model.Clef.prototype.setStaffPosition = function(staffPos) {
    // only redraw the glyph if it needs to be redrawn
    if (this.props.staffPos == staffPos) {
        return;
    }
   
    // reset clef position in model
    this.props.staffPos = staffPos;

    // update affected pitched elements on the staff
    this.staff.updatePitchedElements({clef: this});

    $(this).trigger("vUpdateStaffPosition", [this]);
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

    bb = $.map(bb, Math.round);

    this.zone.ulx = bb[0];
    this.zone.uly = bb[1];
    this.zone.lrx = bb[2];
    this.zone.lry = bb[3];
}

/**
 * Select clef on the drawing surface
 */
Toe.Model.Clef.prototype.selectDrawing = function() {
    $(this).trigger("vSelectDrawing");
}
