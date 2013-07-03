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
 * Creates a new neume component
 *
 * @class Represents a neume component
 * @param {Number} diff Difference from root note
 * @param {Object} options type {string} corresponding to Toe.Model.NeumeComponent.Type
 *                         ornaments {Array} list of Toe.Model.Ornaments
 */
Toe.Model.SquareNoteNeumeComponent = function(pname, oct, options) {
    // call super constructor
    Toe.Model.NeumeComponent.call(this, options);

    // set head shape
    this.setHeadShape(this.props.type);

    this.setPitchInfo(pname, oct);

    // the integer pitch difference is set when the neume is mounted onto a staff
    // since calculating this difference with respect to the root note of the neume
    // requires clef information.
    this.pitchDiff = null;
}

Toe.Model.SquareNoteNeumeComponent.prototype = new Toe.Model.NeumeComponent();
Toe.Model.SquareNoteNeumeComponent.prototype.constructor = Toe.Model.SquareNoteNeumeComponent;

/**
 * Known types of neume components
 *
 * @constant
 * @public
 * @fieldOf Toe.Model.NeumeComponent
 */
Toe.Model.NeumeComponent.Type = {
    punctum: "Punctum",
    virga: "Virga",
    cavum: "Cavum",
    punctum_inclinatum: "Punctum Inclinatum",
    punctum_inclinatum_parvum: "Punctum Inclinatum Parva",
    quilisma: "Quilisma"
};

Toe.Model.SquareNoteNeumeComponent.prototype.setHeadShape = function(shape) {
    this.props.type = shape.toLowerCase();
    this.props.name = Toe.Model.NeumeComponent.Type[this.props.type];
    if (this.props.name == undefined) {
        throw new Error("NeumeComponent: undefined head shape");
    }
}

// set integer pitch difference with respect to root note of the neume
Toe.Model.SquareNoteNeumeComponent.prototype.setPitchDifference = function(pitchDiff) {
    this.pitchDiff = pitchDiff;
}

// set pitch information
Toe.Model.SquareNoteNeumeComponent.prototype.setPitchInfo = function(pname, oct) {
    this.pname = pname;
    this.oct = oct;
}

/**
 * Check if the neume component has the specified ornament
 *
 * @methodOf Toe.Model.SquareNoteNeumeComponent
 * @param {String} oType ornament type
 * @return {Number} 1 if ornament exists, 0 if does not exist 
 */
Toe.Model.SquareNoteNeumeComponent.prototype.hasOrnament = function(oType) {
    return $.grep(this.props.ornaments, function(o) {
        return o.key == oType.toLowerCase();
    }).length;
}

/**
 * Add an ornament to the neume component.
 *
 * @methodOf Toe.Model.SquareNoteNeumeComponent
 * @param {Toe.Model.Ornament}
 */
Toe.Model.SquareNoteNeumeComponent.prototype.addOrnament = function(ornament) {
    // check argument is an ornament
    if (!(ornament instanceof Toe.Model.Ornament)) {
        throw new Error("NeumeComponent: Invalid ornament");
    }

    // add this ornament to the list of ornaments
    // if the ornament is not already attached to the neume component.
    if (!this.hasOrnament(ornament.key)) {
        this.props.ornaments.push(ornament);
    }
}

/**
 * Remove an ornament from the neume component
 *
 * @methodOf Toe.Model.SquareNoteNeumeComponent
 * @param {String} oType ornament type (dot, horizEpisema, vertEpisema)
 */
Toe.Model.SquareNoteNeumeComponent.prototype.removeOrnament = function(oType) {
    // filter out ornaments with the type "oType"
    this.props.ornaments = $.grep(this.props.ornaments, function(o) {
        return o.key == oType.toLowerCase();
    }, true);
}
