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
 * Creates a system
 * @class Represents a system
 * 
 * @param {Array} bb [ulx, uly, lrx, lry] system bounding box
 * (.) <ulx,uly>        (.)
 *
 *
 * (.)        <lrx,lry> (.)
 *
 * @param {Object} options [numlines {Number}, interact {Boolean}]
 *
 * The system has list of elements on the system, sorted by horizontal position.
 * The system model is a generic container to accomodate staffless glyphs without pitch.
 */
Toe.Model.System = function(bb, options) {
    // prevent construction of prototype object without parameters
    if (!arguments.length) return;

    // default 4 stafflines
    this.props = {
        numLines: 4,
        interact: true,
        group: true
    };

    $.extend(this.props, options);

    // set position
    if(!Toe.validBoundingBox(bb)) {
        throw new Error("System: invalid bounding box");
    }

    this.zone = {};
    this.zone.ulx = bb[0];
    this.zone.uly = bb[1];
    this.zone.lrx = bb[2];
    this.zone.lry = bb[3];

    // cache delta y: pixels between stafflines
    if (this.props.numLines > 1) {
        this.delta_y = Math.abs(this.zone.lry - this.zone.uly) / (this.props.numLines-1);
    }

    // id of the system.
    this.id = null;

    // Order number (system break/sb number).
    this.orderNumber = null;

    // Associated system ID.
    this.systemId = null;

    this.elements = [];
};

Toe.Model.System.prototype = new Toe.Model.Model();
Toe.Model.System.prototype.constructor = Toe.Model.System;

/**
 * Sets ID of system (system break).
 *
 * @methodOf Toe.Model.System
 * @param {String} id
 */
Toe.Model.System.prototype.setID = function(sid) {
    this.id = sid;
};

/**
 * Sets ID of associated system element.
 *
 * @methodOf Toe.Model.System
 * @param {String} system id
 */
Toe.Model.System.prototype.setSystemID = function(aSystemId) {
    this.systemId = aSystemId;
};

/**
 * Sets order number of system (system break).
 *
 * @methodOf Toe.Model.System
 * @param {int} aOrderNumber
 */
Toe.Model.System.prototype.setOrderNumber = function(aOrderNumber) {
    this.orderNumber = aOrderNumber;
};

/**
 * Sets the bounding box of the system
 *
 * @methodOf Toe.Model.System
 * @param {Array} bb [ulx,uly,lrx,lry]
 */
Toe.Model.System.prototype.setBoundingBox = function(bb) {
    if(!Toe.validBoundingBox(bb)) {
        throw new Error("System: invalid bounding box");
    }
    
    bb = $.map(bb, Math.round);

    this.zone.ulx = bb[0];
    this.zone.uly = bb[1];
    this.zone.lrx = bb[2];
    this.zone.lry = bb[3];

    // update delta_y cache
    if (this.props.numLines > 1) {
        this.delta_y = Math.abs(this.zone.lry - this.zone.uly) / (this.props.numLines-1);
    }
};

// sort based on ulx bounding box position
Toe.Model.System.prototype.sortElements = function() {
    this.elements.sort(function(el1, el2) {
        return el1.zone.ulx - el2.zone.ulx;
    });
};

// insert element in the element list (sorted in ascending order
// by x position).
Toe.Model.System.prototype.insertElement = function(ele) {
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
};

// Remove element by ID
Toe.Model.System.prototype.removeElementByID = function(eleID) {
    for (var i = this.elements.length-1; i >= 0; i--) {
        if (this.elements[i].id == eleID) {
            // remove drawing
            $(this.elements[i]).trigger("vEraseDrawing");
            this.elements.splice(i,1);
        }
    }
};

// remove element by reference
Toe.Model.System.prototype.removeElementByRef = function(ele) {
    var eleInd = $.inArray(ele, this.elements);

    if (eleInd >= 0) {
        // remove drawing
        $(this.elements[eleInd]).trigger("vEraseDrawing");
        this.elements.splice(eleInd, 1);
    }
};

/**
 * Get clef acting on an element
 *
 * @methodOf Toe.Model.System
 */
Toe.Model.System.prototype.getActingClefByEle = function(element) {
    var eleInd = $.inArray(element, this.elements);
    // look backwards for first clef
    for (var i = eleInd; i >= 0; i--) {
        var e = this.elements[i];
        if (e instanceof Toe.Model.Clef) {
            return e;
        }
    }

    // if no clef is on the system
    return null;
};

Toe.Model.System.prototype.getActingClefByCoords = function(coords) {
    // look backwards from end of element list for first clef
    for (var i = this.elements.length; i >= 0; i--) {
        var e = this.elements[i];
        if (e instanceof Toe.Model.Clef && coords.x > e.zone.lrx) {
            return e;
        }
    }

    // if no clef is found
    return null;
};

// Given a clef mounted on this system, get the previous acting clef
Toe.Model.System.prototype.getPreviousClef = function(clef) {
    var oldClefInd = $.inArray(clef, this.elements);
    // only search if the clef is not the first clef, and is mounted on this system
    if (oldClefInd > 0) {
        for (var i = oldClefInd-1; i >= 0; i--) {
            if (this.elements[i] instanceof Toe.Model.Clef) {
                return this.elements[i];
            }
        }
    }

    // if no clef is found
    return null;
};

/**
 * Returns width of system.
 *
 * @methodOf Toe.Model.System
 * @returns {int} width of system
 */
Toe.Model.System.prototype.getWidth = function() {
    return this.zone.lrx - this.zone.ulx;
};

/**
 * Returns height of system.
 *
 * @methodOf Toe.Model.System
 * @returns {int} height of system
 */
Toe.Model.System.prototype.getHeight = function() {
    return this.zone.lry - this.zone.uly;
};

/**
 * Given a system, computes the vertical distance between the two.
 *
 * @methodOf Toe.Model.System
 * @param {Toe.Model.System} aSystem
 * @returns {int} vertical distance between system (top of one to bottom of other); it CAN return negative if overlap
 */
Toe.Model.System.prototype.getDistanceFromSystem = function(aSystem) {
    if (aSystem.zone.uly > this.zone.uly) {
        return aSystem.zone.uly - this.zone.lry;
    }
    return this.zone.uly - aSystem.zone.lry;
};

/**
 * Given a set of coordinates, returns snapped coordinates
 * to lines or spaces within the system.
 *
 * @methodOf Toe.Model.System
 * @param {Object} coords {x: ,y: }
 * @returns {Object} snappedCoords {x: xprime, y: yprime}
 */
Toe.Model.System.prototype.getSystemSnapCoordinates = function(coords, width, options) {
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
        // go through each element in system element list to see if the inserted element 
        // intersects with others. If so, offset it.
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

        // check left system boundary
        if (this.elements.length && this.elements[0] instanceof Toe.Model.Clef && left <= this.elements[0].zone.lrx) {
            coordsPrime.x = this.elements[0].zone.lrx + width/2 + 1;
        }
        else if (left <= this.zone.ulx) {
            coordsPrime.x = this.zone.ulx + width/2 + 1;
        }

        // check right system boundary
        if (this.custos && opts.ignoreEle != this.custos && right >= this.custos.zone.ulx) {
            coordsPrime.x = this.custos.zone.ulx - width/2 - 3;
        }
        else if (right >= this.zone.lrx) {
            coordsPrime.x = this.zone.lrx - width/2 - 3;
        }
    }

    return coordsPrime;
};

/**
 * Returns array of elements that are "loose" (i.e. not on the system).
 * It only checks horizontally (naturally).
 *
 * @methodOf Toe.Model.System
 * @returns {Array} array of elements
 */
Toe.Model.System.prototype.getLooseElements = function() {

    var looseElementArray = [];
    if (this.elements && this.elements.length > 0) {
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i].zone.lrx < this.zone.ulx || this.elements[i].zone.ulx > this.zone.lrx) {
                looseElementArray.push(this.elements[i]);
            }
        }
    }
    return looseElementArray;
};