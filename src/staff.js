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
 * Creates a staff
 * @class Represents a Staff
 * 
 * @param {Array} bb [ulx, uly, lrx, lry] staff bounding box
 * (.) <ulx,uly>        (.)
 *
 *
 * (.)        <lrx,lry> (.)
 *
 * @param {Object} options [numlines {Number}, lid {String}, interact {Boolean}]
 *
 * The staff has list of elements on the staff.
 * lid is the layer id since previous final division, which may be on a previous system (staff).
 * lids for subsequent final divisions within the system (staff) are stored in the Toe.Model.Division
 * object, in which instances are stored in the this.elements array.
 */
Toe.Model.Staff = function(bb, options) {
    // set position
    if(!Toe.validBoundingBox(bb)) {
        throw new Error("Staff: invalid bounding box");
    }

    this.zone = new Object();
    this.zone.ulx = bb[0];
    this.zone.uly = bb[1];
    this.zone.lrx = bb[2];
    this.zone.lry = bb[3];

    // default 4 stafflines
    this.props = {
        numLines: 4,
        interact: false
    };

    $.extend(this.props, options);

    // cache delta y: pixels between stafflines
    this.delta_y = Math.abs(this.zone.lry - this.zone.uly) / (this.props.numLines-1);

    // id of the staff
    this.id = null;

    this.custos = null;

    this.elements = new Array();
}

Toe.Model.Staff.prototype.constructor = Toe.Model.Staff;

Toe.Model.Staff.prototype.setID = function(sid) {
    this.id = sid;
}

/**
 * Sets the bounding box of the staff
 *
 * @methodOf Toe.Model.Staff
 * @param {Array} bb [ulx,uly,lrx,lry]
 */
Toe.Model.Staff.prototype.setBoundingBox = function(bb) {
    if(!Toe.validBoundingBox(bb)) {
        throw new Error("Staff: invalid bounding box");
    }
    
    bb = $.map(bb, Math.round);

    this.zone.ulx = bb[0];
    this.zone.uly = bb[1];
    this.zone.lrx = bb[2];
    this.zone.lry = bb[3];

    // update delta_y cache
    this.delta_y = Math.abs(this.zone.lry - this.zone.uly) / (this.props.numLines-1);
}

// if clef is given, return pitched elements under the given acting clef
// otherwise, return all pitched elements
Toe.Model.Staff.prototype.getPitchedElements = function(options) {
    var opts = {
        clef: null
    }

    $.extend(opts, options);

    // return pitched elements under the given acting clef
    if (opts.clef) {
        var pitchedEles = new Array();
        var cInd = $.inArray(opts.clef, this.elements);
        for (var i = cInd+1; i < this.elements.length && !(this.elements[i] instanceof Toe.Model.Clef); i++) {
            var e = this.elements[i];
            if (e instanceof Toe.Model.Neume || e instanceof Toe.Model.Custos) {
                pitchedEles.push(e);
            }
        }
        return pitchedEles;
    }
    else {
        // return all pitched elements on the staff
        return $.grep(this.elements, function(e) {
            if (e instanceof Toe.Model.Neume || e instanceof Toe.Model.Custos) {
                return e;
            }
        });
    }
}

/**
 * Calculates note pitch name and octave from coordinates of note
 * Coords should be snapped to line/space already! @see ohSnap
 */
Toe.Model.Staff.prototype.calcNoteInfo = function(coords) {
    var yStep = Math.round((coords.y - this.zone.uly) / (this.delta_y/2));

    // get clef pos
    var clef = this.getActingClefByCoords(coords);
    var cShape = clef.shape;

    // add clef offset from step difference of coordinates
    yStep += clef.props.staffPos;

    // ["a", "b", "c", "d", "e", "f", "g"]
    var numChroma = Toe.neumaticChroma.length;

    var iClef = $.inArray(cShape, Toe.neumaticChroma);
    var pInd = (iClef - yStep) % numChroma;
    if (pInd < 0) {
        pInd += numChroma;
    }

    var pname = Toe.neumaticChroma[pInd];
    var oct = 4 - Math.ceil(yStep / numChroma);

    return {pname: pname, oct: oct};
}

// if clef given, update from this clef to the next clef
// otherwise update everything
Toe.Model.Staff.prototype.updatePitchedElements = function(options) {
    var opts = {
        clef: null
    };

    $.extend(opts, options);

    var staff = this;

    // update pitched elements from the given clef to the next clef
    if (opts.clef) {
        $.each(this.getPitchedElements({clef: opts.clef}), function(eInd, e) {
            staff.updateElePitchInfo(e, {clef: opts.clef});
        });
    }
    else {
        var curClef = null;
        $.each(this.elements, function(eInd, e) {
            if (e instanceof Toe.Model.Clef) {
                curClef = e;
            }
            else if (curClef && (e instanceof Toe.Model.Neume || e instanceof Toe.Model.Custos)) {
                staff.updateElePitchInfo(e, {clef: curClef});
            }
        });
    }
}

// update pitch name/octave of each component of the pitched element.
Toe.Model.Staff.prototype.updateElePitchInfo = function(pitchedEle, options) {
    var opts = {
        clef: null
    };

    $.extend(opts, options);

    if (!opts.clef) {
        opts.clef = this.getActingClefByEle(pitchedEle);
    }

    var cShape = opts.clef.shape;

    // ["a", "b", "c", "d", "e", "f", "g"]
    var numChroma = Toe.neumaticChroma.length;

    var iClef = $.inArray(cShape, Toe.neumaticChroma);

    if (pitchedEle instanceof Toe.Model.Neume) {
        $.each(pitchedEle.components, function(ncInd, nc) {
            var finalPitchDiff = opts.clef.props.staffPos - pitchedEle.rootStaffPos - nc.pitchDiff;
            var pInd = (iClef - finalPitchDiff) % numChroma;
            if (pInd < 0) {
                pInd += numChroma;
            }

            // update the pitch information
            nc.setPitchInfo(Toe.neumaticChroma[pInd], 4 - Math.ceil(finalPitchDiff / numChroma));
        });
    }
    else if (pitchedEle instanceof Toe.Model.Custos) {
        var finalPitchDiff = opts.clef.props.staffPos - pitchedEle.rootStaffPos;
        var pInd = (iClef - finalPitchDiff) % numChroma;
        if (pInd < 0) {
            pInd += numChroma;
        }

        // update the pitch information
        pitchedEle.setRootNote(Toe.neumaticChroma[pInd], 4 - Math.ceil(finalPitchDiff / numChroma));
    }
}

// Calculate staff position of note on the staff. 
Toe.Model.Staff.prototype.calcStaffPos = function(pname, oct, clef) {
    // calculate pitch difference from acting clef
    var pitchDiff = this.calcPitchDifference(pname, oct, clef.shape);

    return clef.props.staffPos + pitchDiff;
}

/**
 * Calculate the pitch difference of a note with respect to the clef shape
 *
 * @methodOf Toe.Model.Staff
 * @param {string} pname neume component pname
 * @param {number} octave neume component octave
 * @return {Integer} integer pitch difference
 */
Toe.Model.Staff.prototype.calcPitchDifference = function(pname, octave, clefShape) {
    // ["a", "b", "c", "d", "e", "f", "g"]
    var numChroma = Toe.neumaticChroma.length;
    
    // make root note search in relation to the clef index
    var iClef = $.inArray(clefShape, Toe.neumaticChroma);
    var iRoot = $.inArray(pname, Toe.neumaticChroma);

    var offset = Math.abs(iRoot - iClef);
    if (iClef > iRoot) {
        offset = numChroma + iRoot - iClef;
    }

    // 4 is no magic number! clef position corresponds to fourth octave
    return numChroma*(octave - 4) + offset;
}

// sort based on ulx bounding box position
Toe.Model.Staff.prototype.sortElements = function() {
    this.elements.sort(function(el1, el2) {
        return el1.zone.ulx - el2.zone.ulx;
    });
}

// insert element in the element list (sorted in ascending order
// by x position).
Toe.Model.Staff.prototype.insertElement = function(ele) {
    // by default, we should push to the end of the array
    var iInsert = this.elements.length;
    for (var i = 0; i < this.elements.length; i++) {
        if (ele.zone.ulx <= this.elements[i].zone.ulx) {
            iInsert = i;
            break;
        }
    }

    this.elements.splice(iInsert,0, ele);

    return iInsert;
}

// Remove element by ID
Toe.Model.Staff.prototype.removeElementByID = function(eleID) {
    for (var i = this.elements.length-1; i >= 0; i--) {
        if (this.elements[i].id == eleID) {
            this.elements.splice(i,1);
        }
    }
}

// remove element by reference
Toe.Model.Staff.prototype.removeElementByRef = function(ele) {
    var eleInd = $.inArray(ele, this.elements);
    this.elements.splice(eleInd, 1);
}

/**
 * Get clef acting on an element
 *
 * @methodOf Toe.Model.staff
 */
Toe.Model.Staff.prototype.getActingClefByEle = function(element) {
    var eleInd = $.inArray(element, this.elements);
    // look backwards for first clef
    for (var i = eleInd; i >= 0; i--) {
        var e = this.elements[i];
        if (e instanceof Toe.Model.Clef) {
            return e;
        }
    }

    // if no clef is on the staff
    return null;
}

Toe.Model.Staff.prototype.getActingClefByCoords = function(coords) {
    // look backwards from end of element list for first clef
    for (var i = this.elements.length; i >= 0; i--) {
        var e = this.elements[i];
        if (e instanceof Toe.Model.Clef && coords.x > e.zone.lrx) {
            return e;
        }
    }

    // if no clef is on found
    return null;
}

/**
 * Mounts the clef on the staff
 *
 * @methodOf Toe.Model.Staff
 * @param {Toe.Model.Clef} clef The clef to mount
 * @returns {Toe.Model.Staff} pointer to this staff for chaining
 */
Toe.Model.Staff.prototype.addClef = function(clef, options) {
    if (!(clef instanceof Toe.Model.Clef)) {
        throw new Error("Staff: Invalid clef");
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

    clef.setStaff(this);
    
    // TODO update affected pitched elements on this staff
    
    // update view
    $(clef).trigger("vRenderClef", [clef]);

    // for chaining
    return this;
}

Toe.Model.Staff.prototype.setCustos = function(custos) {
    if (!(custos instanceof Toe.Model.Custos)) {
        throw new Error("Staff: Invalid Custos");
    }

    var clef = this.getActingClefByCoords({x: custos.zone.ulx});
    if (clef) {
        // calculate pitch difference in relation to the clef
        custos.setRootStaffPos(this.calcStaffPos(custos.pname, custos.oct, clef));

        // custos should always be at the end
        // if a custos exists already, replace it
        if (this.elements.length > 0 && this.elements[this.elements.length-1] instanceof Toe.Model.Custos) {
            this.elements[this.elements.length-1] = custos;
        }
        else {
            this.elements.push(custos);
        }

        custos.setStaff(this);
        this.custos = custos;
        
        // update view
        $(custos).trigger("vRenderCustos", [custos]);

    }
    // for chaining
    return this;
}

/**
 * Mounts a neume on the staff
 *
 * @methodOf Toe.Model.Staff
 * @param {Toe.Model.Neume} neume The neume to mount
 * @params {Options} options {justPush: just push to the elements array (don't bother with sorted insert.
                              This option is for inserting from MEI, since elements are in order in MEI 
                              document already. Faster load times.)}
 * @return {Number} ind index of element on the staff
 */
Toe.Model.Staff.prototype.addNeume = function(neume, options) {
    // check argument is a neume
    if (!(neume instanceof Toe.Model.Neume)) {
        throw new Error("Staff: Invalid neume");
    }
    
    var opts = {
        justPush: false
    };

    $.extend(opts, options);

    var clef = this.getActingClefByCoords({x: neume.zone.ulx});
    if (clef) {
        // update neume root note difference
        var rootPitchInfo = neume.getRootPitchInfo();
        neume.rootStaffPos = this.calcStaffPos(neume.components[0].pname, neume.components[0].oct, clef);

        // update pitch differences (wrt. root note) of each note within the neume
        neume.components[0].setPitchDifference(0);
        for (var i = 1; i < neume.components.length; i++) {
            var nc = neume.components[i];
            nc.setPitchDifference(this.calcStaffPos(nc.pname, nc.oct, clef) - neume.rootStaffPos);
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

        neume.setStaff(this);

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
Toe.Model.Staff.prototype.addDivision = function(division, options) {
	// check argument is a division
	if (!(division instanceof Toe.Model.Division)) {
		throw new Error("Staff: invalid division");
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

    division.setStaff(this);

    // update view
	$(division).trigger("vRenderDivision", [division]);

    return nInd;
}

/**
 * Given a set of coordinates, returns snapped coordinates
 * to lines or spaces within the staff.
 *
 * @methodOf Toe.Model.Staff
 * @param {Object} coords {x: ,y: }
 * @returns {Object} snappedCoords {x: xprime, y: yprime}
 */
Toe.Model.Staff.prototype.ohSnap = function(coords, width, options) {
    var opts = {
        ignoreEle: null,
        x: true,
        y: true
    };

    $.extend(opts, options);

    var coordsPrime = coords;

    if (opts.y) {
        // CALCULATE NEW VERTICAL POSITION
        var linesRoot = this.zone.uly;
        var spacesRoot = this.zone.uly + this.delta_y/2;

        // calculate multiple of lines or spaces
        var lineMult = (coords.y - linesRoot) / this.delta_y;
        var lineErr = Math.abs(Math.round(Math.abs(lineMult)) - Math.abs(lineMult));
        var spaceMult = (coords.y - spacesRoot) / this.delta_y;
        var spaceErr = Math.abs(Math.round(Math.abs(spaceMult)) - Math.abs(spaceMult));

        // find the minimum error for lines or spaces
        var minError = Math.min(lineErr, spaceErr);
        // there really should be an argmin in javascript ... sigh
        if (minError == lineErr) {
            // we should snap to the line!
            coordsPrime.y = linesRoot + Math.round(lineMult)*this.delta_y;
        }
        else {
            // we should snap to the space!
            coordsPrime.y = spacesRoot + Math.round(spaceMult)*this.delta_y;
        }
    }

    if (opts.x) {
        // CALCULATE NEW HORIZONTAL POSITION
        // go through each element in staff element list to see if the inserted element 
        // temporally intersects with others. If so, offset it.
        var left = coords.x-(width/2);
        var right = coords.x+(width/2);
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i] == opts.ignoreEle) {
                continue;
            }

            var ulx = this.elements[i].zone.ulx;
            var lrx = this.elements[i].zone.lrx;

            if (left >= lrx) {
                continue;
            }
            else {
                if ((left >= ulx && left < lrx) || (right >= ulx && right < lrx) || (ulx > left && lrx < right)) {
                    // uh oh - we've intersected a drawn element
                    var bbCentre = ulx + (lrx-ulx)/2;
                    // figure out if we should move it to the left or right
                    if (coords.x < bbCentre) {
                        // move left
                        // TODO: check that other elements aren't drawn here
                        coordsPrime.x = ulx - width/2;
                    }
                    else {
                        // move right
                        // TODO: check that other elements aren't drawn here
                        coordsPrime.x = lrx + width/2;
                    }    
                }
                else {
                    coordsPrime.x = coords.x;
                }
                break;
            }
        }

        // check left staff boundary
        if (left <= this.zone.ulx) {
            coordsPrime.x = this.zone.ulx + width/2 + 1;
        }

        // check right staff boundary
        if (this.custos && opts.ignoreEle != this.custos && right >= this.custos.zone.ulx) {
            coordsPrime.x = this.custos.zone.ulx - width/2 - 3; 
        }
        else if (right >= this.zone.lrx) {
            coordsPrime.x = this.zone.lrx - width/2 - 3;
        }
    }

    return coordsPrime;
}
