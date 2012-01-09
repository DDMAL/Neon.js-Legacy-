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

// Implementation Notes
// Each neume has:
// name, root pitch, list of neume elements, each element has difference from root pitch (int)
// modifier (liquescence etc.) - alt, shift, ctrl, ctrl+shift

/**
 * @requires Toe
 * @class Neume
 */
Toe.Neume = function(rendEng, options) {
    // initialize bounding box
    this.zone = new Object();

    this.rendEng = rendEng;

    this.props = {
        name: null,
        rootNote: {
            rootPitch: "c",
            rootOct: 3
        },
        modifier: null,
        interact: true
    };

    // initialize neume component array
    this.components = new Array();

    $.extend(this.props, options);
}

Toe.Neume.prototype.constructor = Toe.Neume;

Toe.Neume.prototype.setBoundingBox = function(bb) {
    // set position
    this.zone.ulx = bb[0];
    this.zone.uly = bb[1];
    this.zone.lrx = bb[2];
    this.zone.lry = bb[3];
}

Toe.Neume.prototype.getPitchDifference = function(pname, oct) {
    var numChroma = Toe.neumaticChroma.length;
    var rootNum = (this.props.rootNote.rootOct * numChroma) + $.inArray(this.props.rootNote.rootPitch, Toe.neumaticChroma);
    
    var ncNum = (oct * numChroma) + $.inArray(pname, Toe.neumaticChroma);
    
    return ncNum - rootNum;
}

Toe.Neume.prototype.neumeFromMei = function(neumeData, facs) {
    this.props.name = $(neumeData).attr("name");
    
    // set bounding box
    var ulx = parseInt($(facs).attr("ulx"));
    var uly = parseInt($(facs).attr("uly"));
    var lrx = parseInt($(facs).attr("lrx"));
    var lry = parseInt($(facs).attr("lry"));

    this.setBoundingBox([ulx, uly, lrx, lry]);

    // cache a local copy of this so the handle isn't overidden within the jquery function
    var theNeume = this;
    $(neumeData).find("note").each(function(it, el) {
        var pname = $(el).attr("pname");
        var oct = parseInt($(el).attr("oct"));
        //console.log("nc: " + pname + ", " + oct);

        if (theNeume.components.length == 0) {
            theNeume.props.rootNote.rootPitch = pname;
            theNeume.props.rootNote.rootOct = oct;
        }
 
        var diff = theNeume.getPitchDifference(pname, oct);
        //DEBUG: console.log("note diff: " + diff);

        // TODO: get type of nc from mei
        theNeume.components.push(new Toe.NeumeComponent(diff, theNeume.rendEng, {type: "punctum"}));
    });

    // for chaining
    return this;
}

// neumePos is index 0 based
Toe.Neume.prototype.addComponent = function(svgkey, diff, options) {
    opts = {
        neumePos: null
    };

    $.extend(opts, options);

    var nc = new Toe.NeumeComponent(svgkey, diff, this.rendEng);

    if (!opts.neumePos || opts.neumePos > this.components.length || opts.neumePos < 0) {
        this.components.push(nc);
    }
    else {
        this.components.splice(opts.neumePos, 0, nc);
    }
}

Toe.Neume.prototype.deriveName = function() { 
    if (this.components.length == 0) {
        return "unknown";
    }
}

Toe.Neume.prototype.render = function() {
    if (!this.rendEng) {
        throw new Error("Clef: Invalid render context");
    }
}
