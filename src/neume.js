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
        key: "punctum",
        type: Toe.Neume.Type.punctum,
        rootNote: {
            pitch: "c",
            octave: 3
        },
        modifier: null,
        interact: true
    };

    $.extend(this.props, options);

    // initialize neume component array
    this.components = new Array();
}

Toe.Neume.prototype.constructor = Toe.Neume;

// Neumes encoded from the Fundamental Neumes Board in Medieval Finale
Toe.Neume.Type = {
    punctum: {
        name: "Punctum",
        melodicMove: [0]
    },
    virga: {
        name: "Virga",
        melodicMove: [0]
    },
    bivirga: {
        name: "Bivirga",
        melodicMove: [0, 0]
    },
    distropha: {
        name: "Distropha",
        melodicMove: [0, 0]
    },
    tristropha: {
        name: "Tristropha",
        melodicMove: [0, 0, 0]
    },
    clivis: {
        name: "Clivis",
        melodicMove: [0, -1]
    },
    climacus: {
        name: "Climacus",
        melodicMove: [0, -1, -1]
    },
    climacus2: {
        name: "Climacus 2",
        melodicMove: [0, -1, -1, -1]
    },
    climacus3: {
        name: "Climacus 3",
        melodicMove: [0, -1, -1, -1, -1]
    },
    climacus4: {
        name: "Climacus 4",
        melodicMove: [0, -1, -1, -1, -1, -1]
    },
    climacusresup: {
        name: "Climacus resupinus",
        melodicMove: [0, -1, -1, 1]
    },
    climacusresup2: {
        name: "Climacus resupinus 2",
        melodicMove: [0, -1, -1, -1, 1]
    },
    climacusresup3: {
        name: "Climacus resupinus 3",
        melodicMove: [0, -1, -1, -1, -1, 1]
    },
    climacusresup4: {
        name: "Climacus resupinus 4",
        melodicMove: [0, -1, -1, -1, -1, -1, 1]
    },
    podatus: {
        name: "Podatus (Pes)",
        melodicMove: [0, 1]
    },
    podatussub: {
        name: "Podatus subpunctis",
        melodicMove: [0, 1, -1, -1]
    },
    podatussub2: {
        name: "Podatus subpunctis 2",
        melodicMove: [0, 1, -1, -1, -1]
    },
    podatussub3: {
        name: "Podatus subpunctis 3",
        melodicMove: [0, 1, -1, -1, -1, -1]
    },
    podatussub4: {
        name: "Podatus subpunctis 4",
        melodicMove: [0, 1, -1, -1, -1, -1, -1]
    },
    podatussubresup: {
        name: "Podatus Subpunctis resupinus",
        melodicMove: [0, 1, -1, -1, 1]
    },
    podatussubresup2: {
        name: "Podatus Subpunctis resupinus 2",
        melodicMove: [0, 1, -1, -1, -1, 1]
    },
    podatussubresup3: {
        name: "Podatus Subpunctis resupinus 3",
        melodicMove: [0, 1, -1, -1, -1, -1, 1]
    },
    scandicus: {
        name: "Scandicus",
        melodicMove: [0, 1, 1]
    },
    scandicus2: {
        name: "Scandicus 2",
        melodicMove: [0, 1, 1, 1]
    },
    scandicus3: {
        name: "Scandicus 3",
        melodicMove: [0, 1, 1, 1, 1]
    },
    scandicusflex: {
        name: "Scandicus flexus",
        melodicMove: [0, 1, 1, -1]
    },
    scandicusflex2: {
        name: "Scandicus flexus 2",
        melodicMove: [0, 1, 1, 1, -1]
    },
    scandicusflex3: {
        name: "Scandicus flexus 3",
        melodicMove: [0, 1, 1, 1, 1, -1]
    },
    scandicussub: {
        name: "Scandicus subpunctis",
        melodicMove: [0, 1, 1, -1, -1]
    },
    scandicussub2: {
        name: "Scandicus subpunctis 2",
        melodicMove: [0, 1, 1, -1, -1, -1]
    },
    porrectus: {
        name: "Porrectus",
        melodicMove: [0, -1, 1]
    },
    porrectusflex: {
        name: "Porrectus flexus",
        melodicMove: [0, -1, 1, -1]
    },
    porrectussub: {
        name: "Porrectus subpunctis",
        melodicMove: [0, -1, 1, -1, -1]
    },
    porrectussub2: {
        name: "Porrectus subpunctis 2",
        melodicMove: [0, -1, 1, -1, -1, -1]
    },
    porrectussubresup: {
        name: "Porrectus Subpunctis resupinus",
        melodicMove: [0, -1, 1, -1, -1, 1]
    },
    porrecussubresup2: {
        name: "Porrectus Subpunctis resupinus 2",
        melodicMove: [0, -1, 1, -1, -1, -1, 1]
    },
    compound1: {
        name: "Compound Neume 1",
        melodicMove: [0, -1, 1, 1, -1]
    },
    compound2: {
        name: "Compound Neume 2",
        melodicMove: [0, -1, 1, 1]
    },
    torculus: {
        name: "Torculus",
        melodicMove: [0, 1, -1]
    },
    torculusresup: {
        name: "Torculus resupinus",
        melodicMove: [0, 1, -1, 1]
    },
    torculusresup2: {
        name: "Torculus resupinus 2",
        melodicMove: [0, 1, -1, 1, -1]
    },
    torculusresup3: {
        name: "Torculus resupinus 3",
        melodicMove: [0, 1, -1, 1, -1, -1]
    },
    torculusresup4: {
        name: "Torculus resupinus 4",
        melodicMove: [0, 1, -1, 1, -1, -1, -1]
    }
};

Toe.Neume.prototype.setBoundingBox = function(bb) {
    // set position
    this.zone.ulx = bb[0];
    this.zone.uly = bb[1];
    this.zone.lrx = bb[2];
    this.zone.lry = bb[3];
}

Toe.Neume.prototype.setRootNote = function(pname, oct) {
    this.props.rootNote.pitch = pname;
    this.props.rootNote.octave = oct;
}

Toe.Neume.prototype.getPitchDifference = function(pname, oct) {
    var numChroma = Toe.neumaticChroma.length;
    var rootNum = (this.props.rootNote.octave * numChroma) + $.inArray(this.props.rootNote.pitch, Toe.neumaticChroma);
 
    var ncNum = (oct * numChroma) + $.inArray(pname, Toe.neumaticChroma);
    return ncNum - rootNum;
}

Toe.Neume.prototype.neumeFromMei = function(neumeData, facs) {
    // check the DOM element is in fact a neume
    if (neumeData.nodeName.toLowerCase() != "neume") {
        throw new Error("neumeFromMei: invalid neume data");
    }

    this.props.key = $(neumeData).attr("name");
    this.props.type = Toe.Neume.Type[this.props.key];
    // if neume is unknown
    if (this.props.type == undefined) {
        this.props.type = "unknown";
    }
    
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

        // set root note
        if (theNeume.components.length == 0) {
            theNeume.props.rootNote.pitch = pname;
            theNeume.props.rootNote.octave = oct;
        }
 
        var diff = theNeume.getPitchDifference(pname, oct);

        var ncType = "punctum";
        if ($(this).parent().attr("inclinatum") == "true") {
            ncType = "inclinatum";
        }

        theNeume.addComponent(ncType, diff);
    });

    // for chaining
    return this;
}

// neumePos is index 0 based
Toe.Neume.prototype.addComponent = function(type, diff, options) {
    opts = {
        neumePos: null
    };

    $.extend(opts, options);

    var nc = new Toe.NeumeComponent(diff, this.rendEng, {type: type});

    if (!opts.neumePos || opts.neumePos > this.components.length || opts.neumePos < 0) {
        this.components.push(nc);
    }
    else {
        this.components.splice(opts.neumePos, 0, nc);
    }
}

Toe.Neume.prototype.getDifferences = function() {
    var diffs = new Array();
    for(var i = 0; i < this.components.length; i++) {
        diffs.push(this.components[i].diff);
    }
    return diffs;
}

Toe.Neume.prototype.deriveName = function() {
    // checks
    if (this.components.length == 0) {
        return "unknown";
    }
    if (this.props.type) {
        return this.props.type.name;
    }

    var diffs = this.getDifferences();

    // convert to ups and downs
    var prevDiff = diffs[0];
    diffs = $.map(diffs, function(x, i) {
        var relation = 0;
        if (x > prevDiff) {
            relation = 1;
        }
        else if (x < prevDiff) {
            relation = -1;
        }
        
        prevDiff = x;
        return relation;
    });

    // linear search for now
    $.each(Toe.Neume.Type, function(key, val) {        
        if($.arraysEqual(diffs, val.melodicMove)) {
            this.props.key = key;
            this.props.type = Toe.Neume.Type[key];
            // if neume is unknown
            if (this.props.type == undefined) {
                this.props.type = "unknown";
            }

            return false; // break
        }
    });

    return this.props.type.name;
}

Toe.Neume.prototype.getRootDifference = function(staff) {
    // get clef pos
    var sl = staff.clef.props.staffLine;
    var c_type = staff.clef.clefInfo.shape;

    var numChroma = Toe.neumaticChroma.length;
    
    // make root note search in relation to the clef index
    var iClef = $.inArray(c_type, Toe.neumaticChroma);
    var iRoot = $.inArray(this.props.rootNote.pitch, Toe.neumaticChroma);

    // 4 is no magic number! clef position corresponds to fourth octave
    var diff = Math.abs(iRoot - iClef) + numChroma*(this.props.rootNote.octave - 4);
    return diff;
}
 
Toe.Neume.prototype.render = function(staff) {
    if (!this.rendEng) {
        throw new Error("Neume: Invalid render context");
    }

    if (!this.props.type) {
        this.deriveName();
    }

    var rootDiff = this.getRootDifference(staff);
    var clef_y = staff.clef.y;

    // derive positions of neume components
    var nc_y = new Array();
    // set root note y pos
    nc_y.push(clef_y + ((~rootDiff + 1) * staff.delta_y / 2));
    for (var i = 1; i < this.components.length; i++) {
        nc_y.push(nc_y[i-1] + ((~this.components[i].diff + 1) * staff.delta_y/2));
    }

    var elements = new Array();

    // render punctum
    if (this.props.type == Toe.Neume.Type.punctum) {
        // look into neume component for more drawing details
        var punct = this.rendEng.getGlyph(this.components[0].props.type.svgkey);
        var glyphPunct = punct.clone().set({left: this.zone.ulx + punct.centre[0], top: nc_y[0]});
        glyphPunct.selectable = this.props.interact;
        glyphPunct.hasControls = false;

        elements.push(glyphPunct);
    }
    if (this.props.type == Toe.Neume.Type.virga) {
        var punct = this.rendEng.getGlyph("punctum");
        var glyphPunct = punct.clone().set({left: this.zone.ulx + punct.centre[0], top: nc_y[0]});
        glyphPunct.selectable = this.props.interact;
        glyphPunct.hasControls = false;

        elements.push(glyphPunct);

        // draw right line coming off punctum
        var rx = glyphPunct.left+punct.centre[0]-1;
        var line = this.rendEng.createLine([rx, nc_y[0], rx, this.zone.lry], {strokeWidth: 2, interact: true});
        this.rendEng.draw([line], {modify: false});
    }
    if (this.props.type == Toe.Neume.Type.clivis) {
        // first punctum
        var punct = this.rendEng.getGlyph("punctum");
        var glyphPunct1 = punct.clone().set({left: this.zone.ulx + punct.centre[0], top: nc_y[0]});
        glyphPunct1.selectable = this.props.interact;
        glyphPunct1.hasControls = false;

        elements.push(glyphPunct1);

        // draw left line coming off first punctum
        var lx = glyphPunct1.left-punct.centre[0]+1;
        var line = this.rendEng.createLine([lx, nc_y[0], lx, this.zone.lry], {strokeWidth: 2, interact: true});
        this.rendEng.draw([line], {modify: false});

        // second punctum
        var glyphPunct2 = punct.clone().set({left: glyphPunct1.left+(2*punct.centre[0]), top: nc_y[1]});
        glyphPunct2.selectable = this.props.interact;
        glyphPunct2.hasControls = false;

        elements.push(glyphPunct2);

        // draw right line coming off punctum
        var rx = glyphPunct1.left+punct.centre[0];
        var line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[1]], {strokeWidth: 2, interact: true});
        this.rendEng.draw([line], {modify: false});
    }
    
    this.rendEng.draw(elements);
}
