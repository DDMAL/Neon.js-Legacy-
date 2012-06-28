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
 * Creates a new note ornament
 *
 * @class Represents a note ornament
 * @param {String} key Type of ornament
 * @see Toe.Model.Ornament.Type
 */
Toe.Model.Ornament = function(key, options) {
    // check valid type
    this.key = key.toLowerCase();
    this.type = Toe.Model.Ornament.Type[this.key];
    if (this.type == undefined) {
        throw new Error("Ornament: undefined ornament type");
    }
    else if (key == "episema") {
        oForm = "horizontal";
    }
    else if (key == "dot") {
        oForm = "aug";
    }
    else {
        oForm = null;
    }

    this.props = {
        form: oForm,
        interact: false
    };

    $.extend(this.props, options);

}

Toe.Model.Ornament.prototype.constructor = Toe.Model.Ornament;

/**
 * Known ornaments for neume components
 *
 * @constant
 * @public
 * @fieldOf Toe.Model.Ornament
 */
Toe.Model.Ornament.Type = {
    episema: "Episema",
    dot: "Dot"
};
