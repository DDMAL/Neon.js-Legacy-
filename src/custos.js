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
 * Creates a new custos 
 *
 * @class Models a custos, a neume at the end of a staff that represents the first
 * note in the next staff.
 * @param {String} pname pitch name of the next note
 * @param {Integer} oct octave of the next note
 */
Toe.Model.Custos = function(pname, oct, options) {
    this.props = {
        interact: false
    };

    $.extend(this.props, options);

    this.pname = pname;
    this.oct = oct;

    // the integer pitch difference relative to the clef
    // this is set when the custos is mounted on a staff
    this.rootStaffPos = null;

    // initialize bounding box
    this.zone = new Object();

    // set by server or MEI so null by default
    this.id = null;

    // reference to the staff this custos is mounted on
    this.staff = null;
}

Toe.Model.Custos.prototype.constructor = Toe.Model.Custos;

/**
 * Sets the bounding box of the custos 
 *
 * @methodOf Toe.Model.Custos
 * @param {Array} bb [ulx, uly, lrx, lry]
 */
Toe.Model.Custos.prototype.setBoundingBox = function(bb) {
    if(!Toe.validBoundingBox(bb)) {
        throw new Error("Division: invalid bounding box");
    }

    this.zone.ulx = bb[0];
    this.zone.uly = bb[1];
    this.zone.lrx = bb[2];
    this.zone.lry = bb[3];
}

/**
 * Sets the id of the custos element.
 * 
 * @methodOf Toe.Model.Custos
 * @param {String} id
 */
Toe.Model.Custos.prototype.setID = function(cid) {
    this.id = cid;
}

Toe.Model.Custos.prototype.setStaff = function(staff) {
    if (!(staff instanceof Toe.Model.Staff)) {
        throw new Error("Custos: invalid staff reference");
    }

    this.staff = staff;
}

/**
 * Sets the pitch name and octave of the custos
 *
 * @methodOf Toe.Model.Custos
 * @param {String} pname pitch name
 * @param {Integer} oct octave
 */
Toe.Model.Custos.prototype.setRootNote = function(pname, oct) {
    this.pname = pname;
    this.oct = oct;
}

/**
 * Sets the pitch difference of the custos in relation to the clef of the staff the 
 * custos is mounted on
 */
Toe.Model.Custos.prototype.setRootStaffPos = function(staffPos) {
    this.rootStaffPos = staffPos;
}
