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
 *                 modifier (liquescence etc.) - alt, shift, ctrl, ctrl+shift in the Medieval Final Plugin.
 * @class Models a neume-a container for one or more notes.
 * @param {Object} options key {string}, type {Toe.Model.CheironomicNeume.Type}, rootNote.pitch {string}, 
 *                 rootNote.octave {number}, modifier {Toe.Model.CheironomicNeume.Modifier}, interact {Boolean}
 */
Toe.Model.CheironomicNeume = function(options) {
    // call super constructor
    Toe.Model.Neume.call(this, options);
}

// inherit prototype from generic neume model
Toe.Model.CheironomicNeume.prototype = new Toe.Model.Neume();
Toe.Model.CheironomicNeume.prototype.constructor = Toe.Model.CheironomicNeume;

// Load neume search tree from json so the tree doesn't need to be populated on load
Toe.Model.CheironomicNeume.SearchTree = new SearchTree();
Toe.Model.CheironomicNeume.SearchTree.populateFromJSON('{"rootNode":{"payload":{"typeid":"punctum","name":"Punctum"},"children":{"1":{"payload":{"typeid":"pes","name":"Pes"},"children":{"1":{"payload":{"typeid":"scandicus.1","name":"Scandicus"},"children":{"1":{"payload":{"typeid":"scandicus.2","name":"Scandicus"},"children":{"1":{"payload":{"typeid":"scandicus.3","name":"Scandicus"},"children":{"1":{"payload":{"typeid":"scandicus.4","name":"Scandicus"},"children":{},"numChildren":0}},"numChildren":1}},"numChildren":1}},"numChildren":1},"-1":{"payload":{"typeid":"torculus","name":"Torculus"},"children":{"1":{"payload":{"typeid":"torculus.resupinus.1","name":"Torculus Resupinus"},"children":{"-1":{"payload":{"typeid":"torculus.resupinus.2","name":"Torculus Resupinus"},"children":{"-1":{"payload":{"typeid":"torculus.resupinus.3","name":"Torculus Resupinus 3"},"children":{"-1":{"payload":{"typeid":"torculus.resupinus.4","name":"Torculus Resupinus 4"},"children":{},"numChildren":0}},"numChildren":1}},"numChildren":1}},"numChildren":1}},"numChildren":1}},"numChildren":2},"-1":{"payload":{"typeid":"clivis","name":"Clivis"},"children":{"1":{"payload":{"typeid":"porrectus","name":"Porrectus"},"children":{},"numChildren":0},"-1":{"payload":{"typeid":"climacus.1","name":"Climacus"},"children":{"-1":{"payload":{"typeid":"climacus.2","name":"Climacus"},"children":{"-1":{"payload":{"typeid":"climacus.3","name":"Climacus"},"children":{"-1":{"payload":{"typeid":"climacus.4","name":"Climacus"},"children":{},"numChildren":0}},"numChildren":1}},"numChildren":1}},"numChildren":1}},"numChildren":2}},"numChildren":2},"numNodes":1}');

/**
 * Fills the neume with data from an MEI neume element
 *
 * @methodOf Toe.Model.CheironomicNeume
 * @param {jQuery wrapped element set} neumeData the MEI neume data
 * @param {jQuery wrapped element set} facs the MEI facs data for the provided neume
 */
Toe.Model.CheironomicNeume.prototype.neumeFromMei = function(neumeData, bb) {
    // check the DOM element is in fact a neume
    if (neumeData.nodeName.toLowerCase() != "neume") {
        throw new Error("neumeFromMei: invalid neume data");
    }

    this.id = $(neumeData).attr("xml:id");
    var nName = $(neumeData).attr("name").toLowerCase();
    var variant = $(neumeData).attr("variant");
    if (variant) {
        variant = variant.toLowerCase();

        // handle liquescent neumes that don't have a special name
        if (variant == "liquescent") {
            this.props.modifier = "liquescence";
        }
    }

    // derive keyword for searching the neume tree
    var notes = $(neumeData).find("note");
    var key = nName;
    switch (nName) {
        case "virga":
        case "tractulus":
            key = "punctum";
            break;
        case "podatus":
            key = nName = "pes";
            break;
        case "epiphonus":
            key = nName = "pes";
            this.props.modifier = "liquescence";
            break;
        case "cephalicus":
            key = nName = "clivis";
            this.props.modifier = "liquescence";
            break;
        case "climacus":
            key += "." + (notes.length-2);
            break;
        case "scandicus":
            key += "." + (notes.length-2);
            break;
        case "torculus":
            if (variant == "resupinus") {
                key += ".resupinus" + (notes.length-3);
            }
            break;
    }

    this.setBoundingBox(bb);

    // search the neume tree for the expected melodic movement of the neume
    var res = Toe.Model.CheironomicNeume.SearchTree.dfs(key);
    if (!res.node) {
        // neume is not found in the search tree, abort
        return;
    }

    if (notes.length != res.edges.length + 1) {
        // the number of expected notes does not match what is in mei document
        // abort, for now
        // TODO: do something to mediate the differences between the search tree and the mei doc
        return;
    }

    // cache a local copy of this so the handle isn't overidden within the jquery function
    var theNeume = this;
    $(notes).each(function(it, el) {
        var ncType = "punctum";
        if ($(this).parent().attr("quilisma") == "true") {
            ncType = "quilisma";
        }
        else if (nName == "virga" || nName == "bivirga" || nName == "trivirga") {
            ncType = "virga";
        }
        else if (nName == "tractulus") {
            ncType = "tractulus";
        }

        // add note ornaments
        var ornaments = new Array();

        // check for dot
        var dotForm = $("> dot", this).attr("form");
        if (dotForm) {
            ornaments.push(new Toe.Model.Ornament("dot", {form: dotForm}));
        }

        var nc = new Toe.Model.CheironomicNeumeComponent({type: ncType, ornaments: ornaments});
        
        // set melodic movement for the neume
        if (it > 0) {
            nc.relativePitch = parseInt(res.edges[it-1]);
        }

        theNeume.addComponent(nc);
    });

    this.deriveName();

    // for chaining
    return this;
}

/**
 * Gets the pitch differences for each component. Ignore the first component since
 * the first pitch difference is always 0 (since it is the root note)
 *
 * @methodOf Toe.Model.SquareNoteNeume
 * @returns {Array} array of pitch differences for each neume component
 */
Toe.Model.CheironomicNeume.prototype.getRelativePitches = function() {
    var diffs = new Array();
    for(var i = 1; i < this.components.length; i++) {
        diffs.push(this.components[i].relativePitch);
    }
    return diffs;
}
    
/**
 * Derives the name of the neume using the pitch differences
 * and sets the name on the model.
 * 
 * @methodOf Toe.Model.CheironomicNeume
 * @returns {string} neume name
 */
Toe.Model.CheironomicNeume.prototype.deriveName = function(options) {
    var opts = {
        enforceHeadShapes: true
    };

    $.extend(opts, options);

    // checks
    if (this.components.length == 0) {
        return "unknown";
    }

    var relativePitches = this.getRelativePitches();

    // search the tree for the neume name
    var res = Toe.Model.CheironomicNeume.SearchTree.search(relativePitches, true);

    if (res.prefix) {
        this.neumePrefix = res.result.typeid;
        this.name = "Compound";
        this.typeid = "compound";
    }
    else {
        this.neumePrefix = null;
        this.name = res.result.name;
        this.typeid = res.result.typeid;
    }

    // situations where name is modified
    // VIRGA: punctum with different head shape
    // TRACTULUS: punctum with different head shape
    // EPIPHONUS: pes with liquescence modifier
    // CEPHALICUS: clivis with liquescence modifier
    if (this.typeid == "punctum" && this.components[0].props.type == "virga") {
        this.name = "Virga";
        this.typeid = "virga";
    }
    else if (this.typeid == "punctum" && this.components[0].props.type == "tractulus") {
        this.name = "Tractulus";
        this.typeid = "tractulus";
    }
    else if (this.typeid == "pes" && this.props.modifier == "liquescence") {
        this.name = "Epiphonus";
        this.typeid = "epiphonus";
    }
    else if (this.typeid == "clivis" && this.props.modifier == "liquescence") {
        this.name = "Cephalicus";
        this.typeid = "cephalicus";
    }

    return this.name;
}

/**
 * Change head shapes of neume components in the model which are changed
 * when neume type changes.
 * TODO
 */
Toe.Model.CheironomicNeume.prototype.enforceHeadShapes = function() {
}
