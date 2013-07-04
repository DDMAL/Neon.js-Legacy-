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
// TODO: get json dump of new search tree for staffless neumes
Toe.Model.CheironomicNeume.SearchTree = new SearchTree();
Toe.Model.CheironomicNeume.SearchTree.populateFromJSON('{"rootNode":{"payload":{"typeid":"punctum","name":"Punctum"},"children":{"0":{"payload":{"typeid":"distropha","name":"Distropha"},"children":{"0":{"payload":{"typeid":"tristropha","name":"Tristropha"},"children":{},"numChildren":0}},"numChildren":1},"1":{"payload":{"typeid":"podatus","name":"Podatus"},"children":{"1":{"payload":{"typeid":"scandicus.1","name":"Scandicus"},"children":{"1":{"payload":{"typeid":"scandicus.2","name":"Scandicus"},"children":{"1":{"payload":{"typeid":"scandicus.3","name":"Scandicus"},"children":{"1":{"payload":{"typeid":"scandicus.4","name":"Scandicus"},"children":{},"numChildren":0},"-1":{"payload":{"typeid":"scandicus.flexus.3","name":"Scandicus Flexus"},"children":{},"numChildren":0}},"numChildren":2},"-1":{"payload":{"typeid":"scandicus.flexus.2","name":"Scandicus Flexus"},"children":{},"numChildren":0}},"numChildren":2},"-1":{"payload":{"typeid":"scandicus.flexus.1","name":"Scandicus Flexus"},"children":{"-1":{"payload":{"typeid":"scandicus.subpunctis.1","name":"Scandicus Subpunctis"},"children":{"-1":{"payload":{"typeid":"scandicus.subpunctis.2","name":"Scandicus Subpunctis"},"children":{},"numChildren":0}},"numChildren":1}},"numChildren":1}},"numChildren":2},"-1":{"payload":{"typeid":"torculus","name":"Torculus"},"children":{"1":{"payload":{"typeid":"torculus.resupinus.1","name":"Torculus Resupinus"},"children":{"-1":{"payload":{"typeid":"torculus.resupinus.2","name":"Torculus Resupinus"},"children":{"-1":{"payload":{"typeid":"torculus.resupinus.3","name":"Torculus Resupinus"},"children":{"-1":{"payload":{"typeid":"torculus.resupinus.4","name":"Torculus Resupinus"},"children":{},"numChildren":0}},"numChildren":1}},"numChildren":1}},"numChildren":1},"-1":{"payload":{"typeid":"podatus.subpunctis.1","name":"Podatus Subpunctis"},"children":{"1":{"payload":{"typeid":"podatus.subpunctis.resupinus.1","name":"Podatus Subpunctis Resupinus"},"children":{},"numChildren":0},"-1":{"payload":{"typeid":"podatus.subpunctis.2","name":"Podatus Subpunctis"},"children":{"1":{"payload":{"typeid":"podatus.subpunctis.resupinus.2","name":"Podatus Subpunctis Resupinus"},"children":{},"numChildren":0},"-1":{"payload":{"typeid":"podatus.subpunctis.3","name":"Podatus Subpunctis"},"children":{"1":{"payload":{"typeid":"podatus.subpunctis.resupinus.3","name":"Podatus Subpunctis Resupinus"},"children":{},"numChildren":0},"-1":{"payload":{"typeid":"podatus.subpunctis.4","name":"Podatus Subpunctis"},"children":{},"numChildren":0}},"numChildren":2}},"numChildren":2}},"numChildren":2}},"numChildren":2}},"numChildren":2},"-1":{"payload":{"typeid":"clivis","name":"Clivis"},"children":{"1":{"payload":{"typeid":"porrectus","name":"Porrectus"},"children":{"1":{"payload":{"typeid":"compound.2","name":"Compound"},"children":{"-1":{"payload":{"typeid":"compound.1","name":"Compound"},"children":{},"numChildren":0}},"numChildren":1},"-1":{"payload":{"typeid":"porrectus.flexus","name":"Porrectus Flexus"},"children":{"-1":{"payload":{"typeid":"porrectus.subpunctis.1","name":"Porrectus Subpunctis"},"children":{"1":{"payload":{"typeid":"porrectus.subpunctis.resupinus.1","name":"Porrectus Subpunctis Resupinus"},"children":{},"numChildren":0},"-1":{"payload":{"typeid":"porrectus.subpunctis.2","name":"Porrectus Subpunctis"},"children":{"1":{"payload":{"typeid":"porrectus.subpunctis.resupinus.2","name":"Porrectus Subpunctis Resupinus"},"children":{},"numChildren":0}},"numChildren":1}},"numChildren":2}},"numChildren":1}},"numChildren":2},"-1":{"payload":{"typeid":"climacus.1","name":"Climacus"},"children":{"1":{"payload":{"typeid":"climacus.resupinus.1","name":"Climacus Resupinus"},"children":{},"numChildren":0},"-1":{"payload":{"typeid":"climacus.2","name":"Climacus"},"children":{"1":{"payload":{"typeid":"climacus.resupinus.2","name":"Climacus Resupinus"},"children":{},"numChildren":0},"-1":{"payload":{"typeid":"climacus.3","name":"Climacus"},"children":{"1":{"payload":{"typeid":"climacus.resupinus.3","name":"Climacus Resupinus"},"children":{},"numChildren":0},"-1":{"payload":{"typeid":"climacus.4","name":"Climacus"},"children":{"1":{"payload":{"typeid":"climacus.resupinus.4","name":"Climacus Resupinus"},"children":{},"numChildren":0}},"numChildren":1}},"numChildren":2}},"numChildren":2}},"numChildren":2}},"numChildren":2}},"numChildren":3},"numNodes":1}');

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
    // perform neume -> neume & modifier transformations
    // For example, in the current MEI neumes module, cephalicus and epiphonus are their
    // own neumes. In the Medieval Finale plugin they are clivis and podatus neumes, respectively,
    // with an alt (liquescence) modifier.
    if (nName == "epiphonus") {
        nName = "podatus";
        this.props.modifier = "liquescence";
    }
    else if (nName == "cephalicus") {
        nName = "clivis";
        this.props.modifier = "liquescence";
    }
    
    this.typeid = nName;

    this.setBoundingBox(bb);

    // cache a local copy of this so the handle isn't overidden within the jquery function
    var theNeume = this;
    $(neumeData).find("note").each(function(it, el) {
        var ncType = "punctum";
        if ($(this).parent().attr("quilisma") == "true") {
            ncType = "quilisma";
        }
        else if (nName == "virga" || nName == "bivirga" || nName == "trivirga") {
            ncType = "virga";
        }

        // add note ornaments
        var ornaments = new Array();

        // check for dot
        var dotForm = $("> dot", this).attr("form");
        if (dotForm) {
            ornaments.push(new Toe.Model.Ornament("dot", {form: dotForm}));
        }

        var nc = new Toe.Model.CheironomicNeumeComponent({type: ncType, ornaments: ornaments});

        theNeume.addComponent(nc);
    });

    // for chaining
    return this;
}

/**
 * Derives the name of the neume using the pitch differences
 * and sets the name on the model.
 * 
 * @methodOf Toe.Model.CheironomicNeume
 * @returns {string} neume name
 * TODO: search the new tree for deriving the neume typeid
 */
Toe.Model.CheironomicNeume.prototype.deriveName = function(options) {
    var opts = {
        enforceHeadShapes: true
    };

    $.extend(opts, options);

    return this.name;
}

/**
 * Change head shapes of neume components in the model which are changed
 * when neume type changes.
 * TODO
 */
Toe.Model.CheironomicNeume.prototype.enforceHeadShapes = function() {
}
