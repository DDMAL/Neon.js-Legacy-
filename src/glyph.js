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
 * Creates a glyph
 *
 * @class Represents a glyph imported from SVG
 * @param {string} svgKey svg lookup id
 * @param {fabric.js.Object} corresponding fabric.js object
 */
Toe.Model.Glyph = function(svgKey, fabricObj) {
    this.key = svgKey;
    this.obj = fabricObj;

    this.centre = [this.obj.width/2, this.obj.height/2];
}

Toe.Model.Glyph.prototype.constructor = Toe.Glyph;

/**
 * Wrapper function to clone the internal canvas object
 * @methodOf Toe.Model.Glyph
 */
Toe.Model.Glyph.prototype.clone = function() {
    return this.obj.clone();
}
