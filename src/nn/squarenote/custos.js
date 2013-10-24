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
 * Creates a new custos 
 *
 * @class Models a custos, a neume at the end of a system that represents the pitch 
 * of the first note in the next system.
 * @param {String} pname pitch name of the next note
 * @param {Integer} oct octave of the next note
 * @param {Object} options key: {Boolean} interact Whether the glyph can be interacted with.
 */
Toe.Model.Custos = function(pname, oct, options) {
    this.props = {
        interact: true
    };

    $.extend(this.props, options);

    this.pname = pname;
    this.oct = oct;

    // the integer pitch difference relative to the clef
    // this is set when the custos is mounted on a system
    this.rootSystemPos = null;

    // initialize bounding box
    this.zone = new Object();

    // set by server or MEI so null by default
    this.id = null;

    // reference to the system this custos is mounted on
    this.system = null;
}

Toe.Model.Custos.prototype.constructor = Toe.Model.Custos;

/**
 * Sets the bounding box of the custos.
 *
 * @methodOf Toe.Model.Custos
 * @param {Array} bb [ulx, uly, lrx, lry]
 */
Toe.Model.Custos.prototype.setBoundingBox = function(bb) {
    if(!Toe.validBoundingBox(bb)) {
        throw new Error("Division: invalid bounding box");
    }

    bb = $.map(bb, Math.round);

    this.zone.ulx = bb[0];
    this.zone.uly = bb[1];
    this.zone.lrx = bb[2];
    this.zone.lry = bb[3];
}

/**
 * Sets the ID of the custos element.
 * 
 * @methodOf Toe.Model.Custos
 * @param {String} id
 */
Toe.Model.Custos.prototype.setID = function(cid) {
    this.id = cid;
}

/**
 * Sets the system that this custos element is attached to.
 *
 * @methodOf Toe.Model.Custos
 * @param {Toe.Model.System} aSystem The system model to attach the custos to.
 */
Toe.Model.Custos.prototype.setSystem = function(aSystem) {
    if (!(aSystem instanceof Toe.Model.System)) {
        throw new Error("Toe.Model.Custos: invalid aSystem reference");
    }

    this.system = aSystem;
}

/**
 * Sets the pitch name and octave of the custos.
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
 * Sets the pitch difference of the custos in relation to the clef of the system the
 * custos is mounted on.
 */
Toe.Model.Custos.prototype.setRootSystemPos = function(aSystemPos) {
    // only redraw the glyph if it needs to be redrawn
    if (this.rootSystemPos == aSystemPos) {
        return;
    }

    // reset system position of custos
    this.rootSystemPos = aSystemPos;

    var actingClef = this.system.getActingClefByEle(this);
    var pitchInfo = this.system.calcPitchFromSystemPos(this.rootSystemPos, actingClef);
    this.setRootNote(pitchInfo["pname"], pitchInfo["oct"]);

    $(this).trigger("vUpdateSystemPosition", [this]);
}

/**
 * Select custos on the drawing surface
 */
Toe.Model.Custos.prototype.selectDrawing = function() {
    $(this).trigger("vSelectDrawing");
}

/**
 * Erase the custos on the drawing surface
 */
Toe.Model.Custos.prototype.eraseDrawing = function() {
    $(this).trigger("vEraseDrawing");
}
