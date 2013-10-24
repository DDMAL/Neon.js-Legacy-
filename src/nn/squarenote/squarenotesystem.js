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
 * Creates a square-note notation system with stafflines
 * @class Represents a System
 * 
 * @param {Array} bb [ulx, uly, lrx, lry] system bounding box
 * (.) <ulx,uly>        (.)
 *
 *
 * (.)        <lrx,lry> (.)
 *
 * @param {Object} options [numlines {Number}, interact {Boolean}]
 *
 * The system has list of elements on the staff, sorted by horizontal position.
 */
Toe.Model.SquareNoteSystem = function(bb, options) {
    // call super constructor
    Toe.Model.System.call(this, bb, options);
}

// inherit prototype from generic system model
Toe.Model.SquareNoteSystem.prototype = new Toe.Model.System();
Toe.Model.SquareNoteSystem.prototype.constructor = Toe.Model.SquareNoteSystem;

// if clef is given, return pitched elements under the given acting clef
// otherwise, return all pitched elements
Toe.Model.SquareNoteSystem.prototype.getPitchedElements = function(options) {
    var opts = {
        clef: null,
        neumes: true,
        custos: true
    }

    $.extend(opts, options);

    // return pitched elements under the given acting clef
    if (opts.clef) {
        var pitchedEles = new Array();
        var cInd = $.inArray(opts.clef, this.elements);
        for (var i = cInd+1; i < this.elements.length && !(this.elements[i] instanceof Toe.Model.Clef); i++) {
            var e = this.elements[i];
            if ((e instanceof Toe.Model.Neume && opts.neumes) || (e instanceof Toe.Model.Custos && opts.custos)) {
                pitchedEles.push(e);
            }
        }
        return pitchedEles;
    }
    else {
        // return all pitched elements on the system
        return $.grep(this.elements, function(e) {
            if ((e instanceof Toe.Model.Neume && opts.neumes) || (e instanceof Toe.Model.Custos && opts.custos)) {
                return e;
            }
        });
    }
}

// calculate pitch info of pitched element on this system
// from its staff position.
Toe.Model.SquareNoteSystem.prototype.calcPitchFromStaffPos = function(staffPos, actingClef) {
    // calculate difference from clef position
    var yStep = staffPos - actingClef.props.staffPos;

    // ["a", "b", "c", "d", "e", "f", "g"]
    var numChroma = Toe.neumaticChroma.length;

    var iClef = $.inArray(actingClef.shape, Toe.neumaticChroma);
    var iPitch = (iClef + yStep) % numChroma;
    if (iPitch < 0) {
        iPitch += numChroma;
    }

    var pname = Toe.neumaticChroma[iPitch];

    // calculate octave overflow
    var cInd = $.inArray("c", Toe.neumaticChroma);
    var octOver = $.truncateFloat(yStep / numChroma);
    if (yStep > 0 && (iPitch >= cInd && iPitch < iClef)) {
        octOver++;
    }
    else if (yStep < 0 && (iPitch < cInd || iPitch > iClef)) {
        octOver--;
    }

    var clefOct = 4;
    if (actingClef.shape == "f") {
        clefOct = 3;
    }

    var oct = clefOct + octOver;

    return {pname: pname, oct: oct};
}

// Calculate staff position of note on the staff from pitch information.
// This is the inverse function of @see calcPitchFromStaffPos
Toe.Model.SquareNoteSystem.prototype.calcStaffPosFromPitch = function(pname, oct, actingClef) {
    var clefOct = 4;
    if (actingClef.shape == "f") {
        clefOct = 3;
    }

    // ["a", "b", "c", "d", "e", "f", "g"]
    var numChroma = Toe.neumaticChroma.length;
    
    // make root note search in relation to the clef index
    var iClef = $.inArray(actingClef.shape, Toe.neumaticChroma);
    var iPitch = $.inArray(pname, Toe.neumaticChroma);
    var cInd = $.inArray("c", Toe.neumaticChroma);

    var clefDiff = iPitch - iClef + numChroma*(oct - clefOct);
    if (iPitch < cInd) {
        clefDiff += numChroma;
    }

    var staffPos = actingClef.props.staffPos + clefDiff;
    return staffPos;
}

/**
 * Calculates note pitch name and octave from coordinates of note
 * Coords should be snapped to line/space already! @see Toe.Model.System.getSystemSnapCoordinates
 */
Toe.Model.SquareNoteSystem.prototype.calcPitchFromCoords = function(coords) {
    var staffPos = Math.round((this.zone.uly - coords.y) / (this.delta_y/2));

    // get acting clef
    var actingClef = this.getActingClefByCoords(coords);
    
    return this.calcPitchFromStaffPos(staffPos, actingClef);
}

// if clef given, update from this clef to the next clef
// otherwise update everything
Toe.Model.SquareNoteSystem.prototype.updatePitchedElements = function(options) {
    var opts = {
        clef: null,
        neumes: true,
        custos: false
    };

    $.extend(opts, options);

    var staff = this;

    // update pitched elements from the given clef to the next clef
    if (opts.clef) {
        var pitchedEles = this.getPitchedElements({clef: opts.clef});
        
        // if the custos is under the given acting clef and opts.custos is false
        // (meaning we are not to overwrite its pitch content), then we need to shift
        // the custos drawing accordingly
        if (this.custos && pitchedEles[pitchedEles.length-1] == this.custos && !opts.custos) {
            var newStaffPos = this.calcStaffPosFromPitch(this.custos.pname, this.custos.oct, opts.clef);
            this.custos.setRootStaffPos(newStaffPos);
            pitchedEles.pop();
        }

        $.each(pitchedEles, function(eInd, e) {
            staff.updateElePitchInfo(e, {clef: opts.clef});
        });
    }
    else {
        var curClef = null;
        $.each(this.elements, function(eInd, e) {
            if (e instanceof Toe.Model.Clef) {
                curClef = e;
            }
            else if (curClef && ((e instanceof Toe.Model.Neume && opts.neumes) || (e == this.custos && opts.custos))) {
                staff.updateElePitchInfo(e, {clef: curClef});
            }
            else if (this.custos && e == this.custos && !opts.custos) {
                var newStaffPos = this.calcStaffPosFromPitch(this.custos.pname, this.custos.oct, curClef);
                this.custos.setRootStaffPos(newStaffPos);
            }
        });
    }
}

// update pitch name/octave of each component of the pitched element.
Toe.Model.SquareNoteSystem.prototype.updateElePitchInfo = function(pitchedEle, options) {
    var opts = {
        clef: null
    };

    $.extend(opts, options);

    if (!opts.clef) {
        opts.clef = this.getActingClefByEle(pitchedEle);
    }

    var staff = this;
    if (pitchedEle instanceof Toe.Model.Neume) {
        $.each(pitchedEle.components, function(ncInd, nc) {
            var staffPos = pitchedEle.rootStaffPos + nc.pitchDiff;
            var pitchInfo = staff.calcPitchFromStaffPos(staffPos, opts.clef);

            // update the pitch information
            nc.setPitchInfo(pitchInfo["pname"], pitchInfo["oct"]);
        });
    }
    else if (pitchedEle instanceof Toe.Model.Custos) {
        var staffPos = pitchedEle.rootStaffPos;
        var pitchInfo = this.calcPitchFromStaffPos(staffPos, opts.clef);

        // update the pitch information
        pitchedEle.setRootNote(pitchInfo["pname"], pitchInfo["oct"]);
    }
}

/**
 * Mounts the clef on the staff
 *
 * @methodOf Toe.Model.SquareNoteSystem
 * @param {Toe.Model.Clef} clef The clef to mount
 * @returns {Toe.Model.SquareNoteSystem} pointer to this system for chaining
 */
Toe.Model.SquareNoteSystem.prototype.addClef = function(clef, options) {
    if (!(clef instanceof Toe.Model.Clef)) {
        throw new Error("Toe.Model.SquareNoteSystem: Invalid clef");
    }

    var opts = {
        justPush: false
    };

    $.extend(opts, options);

    // insert neume into list of sorted staff elements
    var nInd = null;
    if (opts.justPush) {
        this.elements.push(clef);
        nInd = this.elements.length-1;
    }
    else {
        nInd = this.insertElement(clef);
    }

    clef.setSystem(this);
    
    // update affected pitched elements on this system
    this.updatePitchedElements({clef: clef, custos: false});
    
    // update view
    $(clef).trigger("vRenderClef", [clef]);

    return nInd;
}

Toe.Model.SquareNoteSystem.prototype.setCustos = function(custos) {
    if (!(custos instanceof Toe.Model.Custos)) {
        throw new Error("Toe.Model.SquareNoteSystem: Invalid Custos");
    }

    var clef = this.getActingClefByCoords({x: custos.zone.ulx});
    if (clef) {
        // calculate pitch difference in relation to the clef
        custos.rootStaffPos = this.calcStaffPosFromPitch(custos.pname, custos.oct, clef);

        // custos should always be at the end
        // if a custos exists already, replace it
        if (this.elements.length > 0 && this.elements[this.elements.length-1] instanceof Toe.Model.Custos) {
            this.elements[this.elements.length-1] = custos;
        }
        else {
            this.elements.push(custos);
        }

        custos.setSystem(this);
        this.custos = custos;
        
        // update view
        $(custos).trigger("vRenderCustos", [custos]);

    }

    // return index in element list
    // custos will always be last in this list
    return this.elements.length-1;
}

/**
 * Mounts a neume on the staff
 *
 * @methodOf Toe.Model.SquareNoteSystem
 * @param {Toe.Model.Neume} neume The neume to mount
 * @params {Options} options {justPush: just push to the elements array (don't bother with sorted insert.
                              This option is for inserting from MEI, since elements are in order in MEI 
                              document already. Faster load times.)}
 * @return {Number} ind index of element on the staff
 */
Toe.Model.SquareNoteSystem.prototype.addNeume = function(neume, options) {
    // check argument is a neume
    if (!(neume instanceof Toe.Model.Neume)) {
        throw new Error("Toe.Model.SquareNoteSystem: Invalid neume");
    }
    
    var opts = {
        justPush: false
    };

    $.extend(opts, options);

    var clef = this.getActingClefByCoords({x: neume.zone.ulx});
    if (clef) {
        // update neume root note difference
        var rootPitchInfo = neume.getRootPitchInfo();
        neume.rootStaffPos = this.calcStaffPosFromPitch(neume.components[0].pname, neume.components[0].oct, clef);

        // update pitch differences (wrt. root note) of each note within the neume
        neume.components[0].setPitchDifference(0);
        for (var i = 1; i < neume.components.length; i++) {
            var nc = neume.components[i];
            nc.setPitchDifference(this.calcStaffPosFromPitch(nc.pname, nc.oct, clef) - neume.rootStaffPos);
        }

        // insert neume into list of sorted staff elements
        var nInd = null;
        if (opts.justPush) {
            this.elements.push(neume);
            nInd = this.elements.length-1;
        }
        else {
            nInd = this.insertElement(neume);
        }

        neume.setSystem(this);

        // update view
        $(neume).trigger("vRenderNeume", [neume]);

        return nInd;
    }
    else {
        return null;
    }
}

/**
 * @params {Options} options {justPush: just push to the elements array (don't bother with sorted insert.
 *                              This option is for inserting from MEI, since elements are in order in MEI 
 *                              document already. Faster load times.)}
 */
Toe.Model.SquareNoteSystem.prototype.addDivision = function(division, options) {
	// check argument is a division
	if (!(division instanceof Toe.Model.Division)) {
		throw new Error("Toe.Model.SquareNoteSystem: invalid division");
	}

    var opts = {
        justPush: false
    };

    $.extend(opts, options);

    // insert division into list of sorted staff elements
    var nInd = null;
    if (opts.justPush) {
        this.elements.push(division);
        nInd = this.elements.length-1;
    }
    else {
        nInd = this.insertElement(division);
    }

    division.setSystem(this);

    // update view
	$(division).trigger("vRenderDivision", [division]);

    return nInd;
}
