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
 * Creates a new page
 *
 * @class Represents a page of music
 */
Toe.Model.Page = function() {

    // initialize systems
    this.systems = new Array();

    // no scaling by default
    this.scale = 1.0;

    // Index of systems with largest dimensions.
    this.systemIndexLargestWidth = -1;
    this.systemIndexLargestHeight = -1;

    // Average system height.
    this.systemAverageHeight = 0;

    // id of the page
    this.id = null;
};

Toe.Model.Page.prototype.constructor = Toe.Model.Page;

/**
 * Sets ID of page.
 *
 * @methodOf Toe.Model.Page
 * @param {String} page ID
 */
Toe.Model.Page.prototype.setID = function(pid) {
    this.id = pid;
};

/**
 * Returns page ID.
 *
 * @methodOf Toe.Model.Page
 * @returns {String} page ID
 */
Toe.Model.Page.prototype.getID = function() {
    return this.id;
};

/**
 * Set canvas width and height directly
 *
 * @methodOf Toe.Model.Page
 * @param {Number} width Width of the page
 * @param {Number} height Height of the page
 */
Toe.Model.Page.prototype.setDimensions = function(width, height) {
    this.width = this.scale*width;
    this.height = this.scale*height;
};

/**
 * Calculate dimensions of page from bounding boxes within facsimile data in MEI file
 * 
 * (.) <ulx,uly>        (.)
 *
 *
 * (.)        <lrx,lry> (.)
 *
 * @methodOf Toe.Model.Page
 * @param {jQuery Wrapped Element Set} meiZones bounding boxes from facsimile data from an MEI document
 * @returns {Array} dimensions [width, height] of the canvas 
 */
Toe.Model.Page.prototype.calcDimensions = function(meiZones) {
    var max_x = 0;
    var max_y = 0;

    $(meiZones).each(function(it, el) {
        var lrx = parseInt($(el).attr("lrx"));
        var lry = parseInt($(el).attr("lry"));
        if (lrx > max_x) {
            max_x = lrx;
        }
        if (lry > max_y) {
            max_y = lry;
        }
    });
    
	// return page properties
    return [max_x, max_y];
};

/**
 * Set the scaling factor of the page, relative to the original document.
 * Scales width and height identically to maintain aspect ratio.
 *
 * @methodOf Toe.Model.Page
 */
Toe.Model.Page.prototype.setPageScale = function(scale) {
    this.scale = scale;
};

/**
 * Given coordinates, find the index of the closest system
 *
 * @methodOf Toe.Model.Page
 * @param {Object} coords {x: , y:}
 * @returns {Number} sInd
 */
Toe.Model.Page.prototype.getClosestSystem = function(coords) {
    var distances = $.map(this.systems, function(s) {
        // calculate distance in y-plane from centre
        var dist = Math.abs(coords.y - (s.zone.lry - (s.zone.lry - s.zone.uly)/2));
        if (coords.x < s.zone.ulx) {
            dist += s.zone.ulx - coords.x;
        }
        else if (coords.x > s.zone.lrx) {
            dist += coords.x - s.zone.lrx;
        }

        return dist;
    });

    sInd = $.inArray(Math.min.apply(Math, distances), distances);

    return this.systems[sInd];
};

/**
 * Given a system, get the next system on the page
 *
 * @methodOf Toe.Model.Page
 * @param {Toe.Model.System} aSystem 
 * @returns {Toe.Model.System} next system (or null if DNE)
 */
Toe.Model.Page.prototype.getNextSystem = function(aSystem) {
    var sInd = $.inArray(aSystem, this.systems);
    if (sInd != -1 && sInd+1 < this.systems.length) {
        return this.systems[sInd+1];
    }
    else {
        return null;
    }
};

/**
 * Given a system, get the previous system on the page
 *
 * @methodOf Toe.Model.Page
 * @param {Toe.Model.System} aSystem 
 * @returns {Toe.Model.System} previous system (or null if DNE)
 */
Toe.Model.Page.prototype.getPreviousSystem = function(aSystem) {
    var sInd = $.inArray(aSystem, this.systems);
    if (sInd-1 >= 0) {
        return this.systems[sInd-1];
    }
    else {
        return null;
    }
};

/**
 * Adds a given number of systems to the page
 *
 * @methodOf Toe.Model.Page
 * @param {Toe.Model.System} aSystem system to add to the model
 * @returns {Toe.Model.Page} pointer to the current page for chaining
 */
Toe.Model.Page.prototype.addSystem = function(aSystem) {

    // We may have to adjust the system numbers.
    if (aSystem.orderNumber > this.systems.length) {
        this.systems.push(aSystem);
    }
    else {
        for (var i = aSystem.orderNumber - 1; i < this.systems.length; i++) {
            this.systems[i].setOrderNumber(parseInt(this.systems[i].orderNumber) + 1);
        }
        this.systems.splice(aSystem.orderNumber - 1, 0, aSystem);
    }

    // Update index of the system with largest width.
    if (this.systemIndexLargestWidth < 0) {
        this.systemIndexLargestWidth = 0;
    }
    else if (aSystem.getWidth() > this.systems[this.systemIndexLargestWidth].getWidth()) {
        this.systemIndexLargestWidth = this.systems.length;
    }

    // Update index of system with largest height.
    if (this.systemIndexLargestHeight < 0) {
        this.systemIndexLargestHeight = 0;
    }
    else if (aSystem.getHeight() > this.systems[this.systemIndexLargestHeight].getHeight()) {
        this.systemIndexLargestHeight = this.systems.length;
    }

    // Update system height average.
    this.systemAverageHeight *= (this.systems.length - 1);
    this.systemAverageHeight += aSystem.getHeight();
    this.systemAverageHeight /= this.systems.length;

	// update view
	$(aSystem).trigger("vRenderSystem", [aSystem]);

    return this;
};

/**
 * Returns reference to the widest system.
 *
 * @methodOf Toe.Model.Page
 * @returns {Toe.Model.System} widest system
 */
Toe.Model.Page.prototype.getWidestSystem = function() {
    var largestWidthIndex = -1;
    for (var i = 0; i < this.systems.length; i++) {
        if (largestWidthIndex == -1 || this.systems[i].getWidth() > this.systems[largestWidthIndex].getWidth()) {
            largestWidthIndex = i;
        }
    }

    if (largestWidthIndex == -1) {
        return null;
    }
    return this.systems[largestWidthIndex];
};

// helper function to parse bounding box information
// "static" function
Toe.Model.Page.prototype.parseBoundingBox = function(zoneFacs) {
    var page = this;
    var ulx = parseInt($(zoneFacs).attr("ulx"));
    var uly = parseInt($(zoneFacs).attr("uly"));
    var lrx = parseInt($(zoneFacs).attr("lrx"));
    var lry = parseInt($(zoneFacs).attr("lry"));
    var bb = $.map([ulx, uly, lrx, lry], function(b) {
        return Math.round(page.scale*b);
    });
    return bb;
};
