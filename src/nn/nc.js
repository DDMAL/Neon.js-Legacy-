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
 * Creates a new neume component
 *
 * @class Represents a neume component
 * @param {Number} diff Difference from root note
 * @param {Object} options type {string} corresponding to Toe.Model.NeumeComponent.Type
 *                         ornaments {Array} list of Toe.Model.Ornaments
 */
Toe.Model.NeumeComponent = function(options) {
    this.props = {
        type: "punctum",
        ornaments: [],
        interact: true
    };

    $.extend(this.props, options);
};

Toe.Model.NeumeComponent.prototype = new Toe.Model.Model();
Toe.Model.NeumeComponent.prototype.constructor = Toe.Model.NeumeComponent;

Toe.Model.NeumeComponent.Type = {
    punctum: "Punctum",
    virga: "Virga",
    cavum: "Cavum",
    punctum_inclinatum: "Punctum Inclinatum",
    punctum_inclinatum_parvum: "Punctum Inclinatum Parva",
    quilisma: "Quilisma",
    tractulus: "Tractulus",
    gravis: "Gravis",
    oriscus: "Oriscus",
    stropha: "Stropha"
};

/**
 * Check if the neume component has the specified ornament
 *
 * @methodOf Toe.Model.NeumeComponent
 * @param {String} oType ornament type
 * @return {Number} 1 if ornament exists, 0 if does not exist 
 */
Toe.Model.NeumeComponent.prototype.hasOrnament = function(oType) {
    return $.grep(this.props.ornaments, function(o) {
        return o.key == oType.toLowerCase();
    }).length;
}

/**
 * Add an ornament to the neume component.
 *
 * @methodOf Toe.Model.NeumeComponent
 * @param {Toe.Model.Ornament}
 */
Toe.Model.NeumeComponent.prototype.addOrnament = function(ornament) {
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
 * @methodOf Toe.Model.NeumeComponent
 * @param {String} oType ornament type (dot, horizEpisema, vertEpisema)
 */
Toe.Model.NeumeComponent.prototype.removeOrnament = function(oType) {
    // filter out ornaments with the type "oType"
    this.props.ornaments = $.grep(this.props.ornaments, function(o) {
        return o.key == oType.toLowerCase();
    }, true);
}
