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
Toe.Model.NeumeComponent = function(diff, options) {
    this.diff = diff;

    this.props = {
        type: "punctum",
        ornaments: [],
        interact: true
    };

    $.extend(this.props, options);

    // check valid type
    this.props.type = this.props.type.toLowerCase();
    this.props.name = Toe.Model.NeumeComponent.Type[this.props.type];
    if (this.props.name == undefined) {
        throw new Error("NeumeComponent: undefined neume component");
    }
}

Toe.Model.NeumeComponent.prototype.constructor = Toe.Model.NeumeComponent;

/**
 * Known types of neume components
 *
 * @constant
 * @public
 * @fieldOf Toe.Model.NeumeComponent
 */
Toe.Model.NeumeComponent.Type = {
    punctum: "Punctum",
    whitepunct: "White Punctum",
    inclinatum: "Punctum Inclinatum",
    smallinclinatum: "Punctum Inclinatum Parvum",
    quilisma: "Quilisma"
};

/**
 * Sets the position of the neume component
 * 
 * @methodOf Toe.Model.NeumeComponent
 * @param {Array} pos [x,y]
 */
Toe.Model.NeumeComponent.prototype.setPosition = function(pos) {
    this.x = pos[0];
    this.y = pos[1];
}

/**
 * Check if the neume component has the specified ornament
 *
 * @methodOf Toe.Model.NeumeComponent
 * @param {String} oType ornament type
 * @return {Boolean} whether the neume component has the ornament of type oType
 */
Toe.Model.NeumeComponent.prototype.hasOrnament = function(oType) {
    var oType = Toe.Model.Ornament.Type[oType];
    if (oType == undefined || this.props.ornaments.length == 0) {
        return false;    
    }
    
    var hasOrnament = false;
    $.each(this.props.ornaments, function(it,el) {
        if (el.type == oType) {
            hasOrnament = true;
            return false;
        }
    });

    return hasOrnament;
}
