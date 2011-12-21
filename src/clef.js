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
 * @requires Toe
 * @class Represents a clef
 * 
 */
Toe.Clef = function(clefType, rendEng, options) {
    clefType = clefType.toLowerCase();

    this.clefInfo = Toe.Clef.types[clefType];
    if (this.clefInfo == undefined) {
        throw new Error("Clef: undefined clef type: '" + clefType + "'");
    }

    this.rendEng = rendEng;

    this.props = {
        staffLine: 2,
        interact: false
    };

    $.extend(this.props, options);
}

Toe.Clef.types = {
    "c": {
        svgKey: "c_clef"
    },
    "f": {
        svgKey: "f_clef"
    }
};

Toe.Clef.prototype.constructor = Toe.Clef;

Toe.Clef.prototype.setPosition = function(pos) {
    this.x = pos[0];
    this.y = pos[1];
}

Toe.Clef.prototype.render = function() {
    if (!this.rendEng) {
        throw new Error("Clef: Invalid render context");
    }

    var clef = this.rendEng.getGlyph(this.clefInfo.svgKey);
    var glyphClef = clef.clone().set({left: this.x, top: this.y});
    glyphClef.selectable = this.props.interact;

    this.rendEng.draw([glyphClef], true);
}
