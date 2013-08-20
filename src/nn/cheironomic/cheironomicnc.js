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
 * Creates a new unpitched neume component within a cheironomic (staffless) neume.
 *
 * @class Represents a neume component
 * @extends Toe.Model.NeumeComponent
 * @param {Object} options type {string} corresponding to Toe.Model.NeumeComponent.Type
 *                         ornaments {Array} list of Toe.Model.Ornaments
 */
Toe.Model.CheironomicNeumeComponent = function(options) {
    // call super constructor
    Toe.Model.NeumeComponent.call(this, options);

    // relative pitch with respect to previous neume component
    this.relativePitch = null;

    // set head shape
    this.setHeadShape(this.props.type);
}

Toe.Model.CheironomicNeumeComponent.prototype = new Toe.Model.NeumeComponent();
Toe.Model.CheironomicNeumeComponent.prototype.constructor = Toe.Model.CheironomicNeumeComponent;

/**
 * Set the head shape of the neume component
 * For cheironomic neumes, this could be a punctum, virga, quilisma, tractulus, gravis, oriscus, stropha
 *
 * @methodOf Toe.Model.CheironomicNeumeComponent
 * @param {String} shape Key for the neume component head shape (@see Toe.Model.NeumeComponent.Type)  
 */
Toe.Model.CheironomicNeumeComponent.prototype.setHeadShape = function(shape) {
    this.props.type = shape.toLowerCase();
    this.props.name = Toe.Model.NeumeComponent.Type[this.props.type];
    if (this.props.name == undefined) {
        throw new Error("NeumeComponent: undefined head shape");
    }
}
