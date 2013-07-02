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

    switch (neume.typeid) {
        case "punctum":
            var punctum = this.rendEng.getGlyph("punctum");
            var left = neume.zone.ulx + punctum.centre[0];
            var top = neume.zone.uly + punctum.centre[1];
            var glyphPunct = punctum.clone().set({left: left, top: top});

            elements.modify.push(glyphPunct);

            break;
        case "virga":
            var virga = this.rendEng.getGlyph("virga");
            var left = neume.zone.ulx + virga.centre[0];
            var top = neume.zone.uly + virga.centre[1];
            var glyphVirga = virga.clone().set({left: left, top: top});

            elements.modify.push(glyphVirga);

            break;
        case "clivis":
            var clivis = this.rendEng.getGlyph("clivis");
            var left = neume.zone.ulx + clivis.centre[0];
            var top = neume.zone.uly + clivis.centre[1];
            var glyphClivis = clivis.clone().set({left: left, top: top});

            elements.modify.push(glyphClivis);

            break;
        case "podatus":
            var podatus = this.rendEng.getGlyph("podatus");
            var left = neume.zone.ulx + podatus.centre[0];
            var top = neume.zone.uly + podatus.centre[1];
            var glyphPodatus = podatus.clone().set({left: left, top: top});

            elements.modify.push(glyphPodatus);

            break;
        case "porrectus":
            var porrectus = this.rendEng.getGlyph("porrectus");
            var left = neume.zone.ulx + porrectus.centre[0];
            var top = neume.zone.uly + porrectus.centre[1];
            var glyphPorrectus = porrectus.clone().set({left: left, top: top});

            elements.modify.push(glyphPorrectus);

            break;
        case "torculus":
            var torculus = this.rendEng.getGlyph("torculus");
            var left = neume.zone.ulx + torculus.centre[0];
            var top = neume.zone.uly + torculus.centre[1];
            var glyphTorculus = torculus.clone().set({left: left, top: top});

            elements.modify.push(glyphTorculus);

            break;
    }
    
    this.drawing = this.rendEng.draw(elements, {group: true, selectable: neume.props.interact, eleRef: neume})[0];

    // update model
    $(neume).trigger("mUpdateBoundingBox", this.drawing);
}
