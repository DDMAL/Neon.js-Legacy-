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
 * Creates a neume
 * Each neume has: name, root pitch, list of neume elements, each element has difference from root pitch (int)
 *                 modifier (liquescence etc.) - alt, shift, ctrl, ctrl+shift
 * @class Neume
 * @param {Object} options key {string}, type {Toe.Model.Neume.Type}, rootNote.pitch {string}, 
 *                 rootNote.octave {number}, modifier {Toe.Model.Neume.Modifier}, interact {Boolean}
 */
Toe.Model.Neume = function(options) {
    // initialize bounding box
    this.zone = new Object();

    this.props = {
        key: "punctum",
        type: null,
        rootNote: {
            pitch: "c",
            octave: 3
        },
        modifier: null,
        interact: true
    };

    $.extend(this.props, options);

    this.props.key = this.props.key.toLowerCase();
    this.props.type = Toe.Model.Neume.Type[this.props.key];

    if (this.props.type == undefined) {
        this.props.key = "compound";
        this.props.type = Toe.Model.Neume.Type.compound;
    }

    // displacement from the clef - set later by the staff model
    // when mounting the neume on the staff. Should not be manually set.
    this.rootDiff = null;

    // initialize neume component array
    this.components = new Array();
}

Toe.Model.Neume.prototype.constructor = Toe.Model.Neume;

/**
 * Neumes encoded from the Fundamental Neumes Board in Medieval Finale
 *
 * @constant
 * @public
 * @fieldOf Toe.Model.Neume
 */
Toe.Model.Neume.Type = {
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
    },
    compound: {
        name: "Compound neume",
        melodicMove: []
    }
};

/**
 * Sets the bounding box of the neume
 *
 * @methodOf Toe.Model.Neume
 * @param {Array} bb [ulx, uly, lrx, lry]
 */
Toe.Model.Neume.prototype.setBoundingBox = function(bb) {
    if(!Toe.validBoundingBox(bb)) {
        throw new Error("Neume: invalid bounding box");
    }

    // set position
    this.zone.ulx = bb[0];
    this.zone.uly = bb[1];
    this.zone.lrx = bb[2];
    this.zone.lry = bb[3];
}

/**
 * Sets the root note of the neume.
 * Staff is optional here to facilitate setting an arbitrary note and attaching it to a different staff
 *
 * @param {string} pname root pitch
 * @param {number} oct root octave
 * @param {Object} options staff {Toe.Model.Staff}: Staff the neume is on to get the clef position information
 */
Toe.Model.Neume.prototype.setRootNote = function(pname, oct, options) {
    var opts = {
        staff: null
    };

    $.extend(opts, options);

    this.props.rootNote.pitch = pname;
    this.props.rootNote.octave = oct;

    // calculate pitch difference relative to the clef on the given staff
    if (opts.staff) {
        this.rootDiff = this.calcPitchDifference(opts.staff, pname, oct);
    }
}

/**
 * Calculate the neume component pitch difference with respect to the position of the clef
 *
 * @methodOf Toe.Model.Neume
 * @param {Toe.Model.Staff} staff Staff the neume is on to get the clef position information
 * @param {string} pitch neume component pitch
 * @param {number} octave neume component octave
 */
Toe.Model.Neume.prototype.calcPitchDifference = function(staff, pitch, octave) {
    // get clef pos
    var c_type = staff.clef.shape;

    // ["a", "b", "c", "d", "e", "f", "g"]
    var numChroma = Toe.neumaticChroma.length;
    
    // make root note search in relation to the clef index
    var iClef = $.inArray(c_type, Toe.neumaticChroma);
    var iRoot = $.inArray(pitch, Toe.neumaticChroma);

    var offset = Math.abs(iRoot - iClef);
    if (iClef > iRoot) {
        offset = numChroma + iRoot - iClef;
    }
    // 4 is no magic number! clef position corresponds to fourth octave
    //var diff = Math.abs(iRoot - iClef) + numChroma*(this.props.rootNote.octave - 4);
    return numChroma*(octave - 4) + offset;
}

/**
 * Calculates the neume component pitch difference with respect to the root note of the neume
 * Requires that the root note has been set.
 * @see Toe.Model.Neume.setRootNote()
 *
 * @methodOf Toe.Model.Neume
 * @param {Toe.Model.Staff} staff Staff the neume is on to get the clef position information
 * @param {string} pitch neume component pitch
 * @param {number} octave neume component octave
 */
Toe.Model.Neume.prototype.calcComponentDifference = function(staff, pitch, octave) {
    var ncClefDiff = this.calcPitchDifference(staff, pitch, octave);
    
    return ncClefDiff - this.rootDiff;
}

/**
 * Fills the neume with data from an MEI neume element
 *
 * @methodOf Toe.Model.Neume
 * @param {jQuery wrapped element set} neumeData the MEI neume data
 * @param {jQuery wrapped element set} facs the MEI facs data for the provided neume
 * @param {Toe.Model.Staff} staff Staff the neume is on to get the clef position information
 */
Toe.Model.Neume.prototype.neumeFromMei = function(neumeData, facs, staff) {
    // check the DOM element is in fact a neume
    if (neumeData.nodeName.toLowerCase() != "neume") {
        throw new Error("neumeFromMei: invalid neume data");
    }

    this.props.key = $(neumeData).attr("name");
    this.props.type = Toe.Model.Neume.Type[this.props.key];
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
        var diff = 0;
        if (it == 0) {
            theNeume.setRootNote(pname, oct, {staff: staff});
        }
        else {
            diff = theNeume.calcComponentDifference(staff, pname, oct);
        }

        var ncType = "punctum";
        if ($(this).parent().attr("inclinatum") == "true") {
            ncType = "inclinatum";
        }

        // add note ornaments
        var ornaments = new Array();

        // check for dot
        var dotForm = $("> dot", this).attr("form");
        if (dotForm) {
            ornaments.push(new Toe.Model.Ornament("dot", {form: dotForm}));
        }

        theNeume.addComponent(ncType, diff, {ornaments: ornaments});
    });

    // for chaining
    return this;
}

/**
 * Adds a neume component to the neume
 * nInd is index 0 based
 *
 * @methodOf Toe.Model.Neume
 * @param {string} Neume component type
 * @diff {number} pitch difference from the root
 * @options {Object} options neumeInd {number} index of where to insert the component in the neume
 */
Toe.Model.Neume.prototype.addComponent = function(type, diff, options) {
    opts = {
        ncInd: this.components.length,
        ornaments: []
    };

    $.extend(opts, options);

    // TODO: check that diff corresponds with the neume melodic move

    var nc = new Toe.Model.NeumeComponent(diff, {type: type, ornaments: opts.ornaments});

    this.components.splice(opts.ncInd, 0, nc);
}

/**
 * Gets the pitch differences for each component
 *
 * @methodOf Toe.Model.Neume
 * @returns {Array} array of pitch differences for each neume component
 */
Toe.Model.Neume.prototype.getDifferences = function() {
    var diffs = new Array();
    for(var i = 0; i < this.components.length; i++) {
        diffs.push(this.components[i].diff);
    }
    return diffs;
}

/**
 * Converts neume component difference integers to basic up/downs in the form of
 * 1 and -1, for up and down, respectively.
 *
 * @methodOf Toe.Model.Neume
 * @returns {Array} melodic movement in ups and downs
 */
Toe.Model.Neume.prototype.diffToMelodicMove = function() {
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

    return diffs;
}

/**
 * Derives the name of the neume using the pitch differences
 * and sets the name on the model.
 * TODO: use binary search tree instead of linear search
 * 
 * @methodOf Toe.Model.Neume
 * @returns {string} neume name
 */
Toe.Model.Neume.prototype.deriveName = function() {
    // checks
    if (this.components.length == 0) {
        return "unknown";
    }

    var diffs = this.diffToMelodicMove();

    // linear search for now
    var found = false;
    for(var key in Toe.Model.Neume.Type) {
        var melody = Toe.Model.Neume.Type[key].melodicMove;
        console.log("key: " + key + ", melody: " + melody, ", diffs: " + diffs); 
        if($.arraysEqual(diffs, melody)) {
            this.props.key = key;
            this.props.type = Toe.Model.Neume.Type[key];
            
            found = true;
            break;
        }
    }

    // if neume is not in the dictionary
    if (!found) {
        this.props.key = "compound";
        this.props.type = Toe.Model.Neume.Type.compound;
    }

    return this.props.type.name;
}
