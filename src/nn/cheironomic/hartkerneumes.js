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
    
    var glyphDot = this.rendEng.getGlyph("dot");

    // fixed holds elements that will not undergo global transformations
    // modify holds elements that will undergo global transformations
    var elements = {fixed: new Array(), modify: new Array()};

    var glyph = null;
    switch (neume.typeid) {
        case "punctum":
            if (neume.props.modifier == "liquescence_aug") {
                glyph = this.rendEng.getGlyph("punctum_liquescence_aug");
            }
            else {
                glyph = this.rendEng.getGlyph("punctum");
            }

            break;
        case "tractulus":
            if (neume.props.modifier == "liquescence_aug") {
                glyph = this.rendEng.getGlyph("punctum_liquescence_aug");
            }
            else {
                glyph = this.rendEng.getGlyph("tractulus");
            }

            break;
        case "virga":
            if (neume.props.modifier == "liquescence_aug") {
                glyph = this.rendEng.getGlyph("virga_liquescence_aug");
            }
            else if (neume.props.modifier == "strata") {
                glyph = this.rendEng.getGlyph("virga_strata");
            }
            else {
                glyph = this.rendEng.getGlyph("virga");
            }

            break;
        case "clivis":
            if (neume.props.modifier == "liquescence_aug") {
                glyph = this.rendEng.getGlyph("clivis_liquescence_aug");
            }
            else if (neume.props.modifier == "liquescence_dim") {
                glyph = this.rendEng.getGlyph("virga_liquescence_aug");
            }
            else {
                glyph = this.rendEng.getGlyph("clivis");
            }

            break;
        case "ancus":
            glyph = this.rendEng.getGlyph("clivis_liquescence_aug");
            break;
        case "cephalicus":
            glyph = this.rendEng.getGlyph("clivis_liquescence_aug");
            break;
        case "podatus":
        case "pes":
            if (neume.props.modifier == "liquescence_aug") {
                glyph = this.rendEng.getGlyph("pes_liquescence_aug");
            }
            else if (neume.props.modifier == "liquescence_dim") {
                glyph = this.rendEng.getGlyph("punctum_liquescence_aug");
            }
            else if (neume.props.modifier == "quassus") {
                glyph = this.rendEng.getGlyph("pes_quassus");
            }
            else {
                glyph = this.rendEng.getGlyph("pes");
            }

            break;
        case "epiphonus":
            glyph = this.rendEng.getGlyph("punctum_liquescence_aug");
            break;
        case "porrectus":
            if (neume.props.modifier == "liquescence_aug") {
                glyph = this.rendEng.getGlyph("porrectus_liquescence_aug");
            }
            else if (neume.props.modifier == "liquescence_dim") {
                glyph = this.rendEng.getGlyph("porrectus_liquescence_dim");
            }
            else {
                glyph = this.rendEng.getGlyph("porrectus");
            }

            break;
        case "torculus":
            if (neume.props.modifier == "liquescence_aug") {
                glyph = this.rendEng.getGlyph("torculus_liquescence_aug");
            }
            else if (neume.props.modifier == "liquescence_dim") {
                glyph = this.rendEng.getGlyph("pes_liquescence_aug");
            }
            else {
                glyph = this.rendEng.getGlyph("torculus");
            }

            break;
        case "scandicus.1":
            if (neume.props.modifier == "liquescence_aug") {
                glyph = this.rendEng.getGlyph("scandicus_liquescence_aug");
            }
            else if (neume.props.modifier == "liquescence_dim") {
                glyph = this.rendEng.getGlyph("scandicus_liquescence_dim");
            }
            else {
                glyph = this.rendEng.getGlyph("scandicus");
            }

            break;
        case "climacus.1":
            if (neume.props.modifier == "liquescence_aug") {
                glyph = this.rendEng.getGlyph("climacus_liquescence_aug");
            }
            else if (neume.props.modifier == "liquescence_dim") {
                glyph = this.rendEng.getGlyph("clivis_liquescence_aug");
            }
            else {
                glyph = this.rendEng.getGlyph("climacus");
            }

            break;
        case "torculus.resupinus.1":
            if (neume.props.modifier == "liquescence_aug") {
                glyph = this.rendEng.getGlyph("torculusresupinus_liquescence_aug");
            }
            else if (neume.props.modifier == "liquescence_dim") {
                glyph = this.rendEng.getGlyph("torculusresupinus_liquescence_dim");
            }
            else {
                glyph = this.rendEng.getGlyph("torculusresupinus");
            }

            break;
        case "torculus.resupinus.flexus":
            if (neume.props.modifier == "liquescence_dim") {
                glyph = this.rendEng.getGlyph("torculusresupinus_liquescence_aug");
            }
            else {
                glyph = this.rendEng.getGlyph("torculusresupinusflexus");
            }

            break;
        case "porrectus.flexus":
            if (neume.props.modifier == "liquescence_aug") {
                glyph = this.rendEng.getGlyph("porrectusflexus_liquescence_aug");
            }
            else if (neume.props.modifier == "liquescence_dim") {
                glyph = this.rendEng.getGlyph("porrectus_liquescence_aug");
            }
            else {
                glyph = this.rendEng.getGlyph("porrectusflexus");
            }
            break;
        case "scandicus.flexus":
            if (neume.props.modifier == "liquescence_aug") {
                glyph = this.rendEng.getGlyph("scandicusflexus_liquescence_aug");
            }
            else if (neume.props.modifier == "liquescence_dim") {
                glyph = this.rendEng.getGlyph("scandicus_liquescence_aug");
            }
            else {
                glyph = this.rendEng.getGlyph("scandicusflexus");
            }

            break;
        case "pes.subbipunctis":
            if (neume.props.modifier == "liquescence_aug") {
                glyph = this.rendEng.getGlyph("pessubbipunctis_liquescence_aug");
            }
            else if (neume.props.modifier == "liquescence_dim") {
                glyph = this.rendEng.getGlyph("torculus_liquescence_aug");
            }
            else {
                glyph = this.rendEng.getGlyph("pessubbipunctis");
            }

            break;
    }

    if (glyph) {
        var left = neume.zone.ulx + glyph.centre[0];
        var top = neume.zone.uly + glyph.centre[1];
        var glyphDwg = glyph.clone().set({left: left, top: top});
        elements.modify.push(glyphDwg);

        // render dots
        for (var i = 0; i < neume.components.length; i++) {
            if (neume.components[i].hasOrnament('dot')) {
                elements.modify.push(glyphDot.clone().set({left: left+(2*glyph.centre[0]), top: top+(glyph.centre[1])}));
            }
        }

        this.drawing = this.rendEng.draw(elements, {group: true, selectable: neume.props.interact, eleRef: neume})[0];

        // update model
        $(neume).trigger("mUpdateBoundingBox", this.drawing);
    }
}
