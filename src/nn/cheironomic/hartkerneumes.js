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

var drawHartkerNeume = function(neume) {
    if (!this.rendEng) {
        throw new Error("Neume: Invalid render context");
    }

    if (this.ledgerLines) {
        this.rendEng.canvas.remove(this.ledgerLines);
    }

    var ncOverlap_x = 1; // (pixels)
    
    // fixed holds elements that will not undergo global transformations
    // modify holds elements that will undergo global transformations
    var elements = {fixed: new Array(), modify: new Array()};

    var glyph = null;
    switch (neume.typeid) {
        case "punctum":
            glyph = this.rendEng.getGlyph("punctum");
            break;
        case "tractulus":
            glyph = this.rendEng.getGlyph("tractulus");
            break;
        case "virga":
            glyph = this.rendEng.getGlyph("virga");
            break;
        case "clivis":
            glyph = this.rendEng.getGlyph("clivis");
            break;
        case "podatus":
        case "pes":
            glyph = this.rendEng.getGlyph("podatus");
            break;
        case "porrectus":
            glyph = this.rendEng.getGlyph("porrectus");
            break;
        case "torculus":
            glyph = this.rendEng.getGlyph("torculus");
            break;
    }

    if (glyph) {
        var left = neume.zone.ulx + glyph.centre[0];
        var top = neume.zone.uly + glyph.centre[1];
        var glyphDwg = glyph.clone().set({left: left, top: top});
        elements.modify.push(glyphDwg);

        this.drawing = this.rendEng.draw(elements, {group: true, selectable: neume.props.interact, eleRef: neume})[0];

        // update model
        $(neume).trigger("mUpdateBoundingBox", this.drawing);
    }
}
