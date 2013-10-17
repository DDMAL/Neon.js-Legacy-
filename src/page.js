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
    // initialize staves
    this.staves = new Array();

    // no scaling by default
    this.scale = 1.0;

    // Index of staves with largest dimensions.
    this.staffIndexLargestWidth = -1;
    this.staffIndexLargestHeight = -1;

    // Average staff height.
    this.staffAverageHeight = 0;

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
}

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
}

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
 * Given coordinates, find the index of the closest staff
 *
 * @methodOf Toe.Model.Page
 * @param {Object} coords {x: , y:}
 * @returns {Number} sInd
 */
Toe.Model.Page.prototype.getClosestStaff = function(coords) {
    var distances = $.map(this.staves, function(s) {
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

    return this.staves[sInd];
};

/**
 * Given a staff, get the next staff on the page
 *
 * @methodOf Toe.Model.Page
 * @param {Toe.Model.Staff} staff 
 * @returns {Staff} nextStaff the next staff
 */
Toe.Model.Page.prototype.getNextStaff = function(staff) {
    var sInd = $.inArray(staff, this.staves);
    if (sInd != -1 && sInd+1 < this.staves.length) {
        return this.staves[sInd+1];
    }
    else {
        return null;
    }
};

Toe.Model.Page.prototype.getPreviousStaff = function(staff) {
    // for each staff, except the first
    var sInd = $.inArray(staff, this.staves);
    if (sInd-1 >= 0) {
        return this.staves[sInd-1];
    }
    else {
        return null;
    }
};

/**
 * Adds a given number of staves to the page
 *
 * @methodOf Toe.Model.Page
 * @param {Toe.Model.Staff} staff the staff to add to the model
 * @returns {Toe.Model.Page} pointer to the current page for chaining
 */
Toe.Model.Page.prototype.addStaff = function(staff) {

    // We may have to adjust the staff numbers.
    if (staff.orderNumber > this.staves.length) {
        this.staves.push(staff);
    }
    else {
        for (var i = staff.orderNumber - 1; i < this.staves.length; i++) {
            this.staves[i].setOrderNumber(parseInt(this.staves[i].orderNumber) + 1);
        }
        this.staves.splice(staff.orderNumber - 1, 0, staff);
    }

    // Update index of staff with largest width.
    if (this.staffIndexLargestWidth < 0) {
        this.staffIndexLargestWidth = 0;
    }
    else if (staff.getWidth() > this.staves[this.staffIndexLargestWidth].getWidth()) {
        this.staffIndexLargestWidth = this.staves.length;
    }

    // Update index of staff with largest height.
    if (this.staffIndexLargestHeight < 0) {
        this.staffIndexLargestHeight = 0;
    }
    else if (staff.getHeight() > this.staves[this.staffIndexLargestHeight].getHeight()) {
        this.staffIndexLargestHeight = this.staves.length;
    }

    // Update staff height average.
    this.staffAverageHeight *= (this.staves.length - 1);
    this.staffAverageHeight += staff.getHeight();
    this.staffAverageHeight /= this.staves.length;

	// update view
	$(staff).trigger("vRenderStaff", [staff]);

    return this;
};

/**
 * Returns reference to the widest staff.
 *
 * @methodOf Toe.Model.Page
 * @returns {Staff} nextStaff the next staff
 */
Toe.Model.Page.prototype.getWidestStaff = function() {
    var largestWidthIndex = -1;
    for (var i = 0; i < this.staves.length; i++) {
        if (largestWidthIndex == -1 || this.staves[i].getWidth() > this.staves[largestWidthIndex].getWidth()) {
            largestWidthIndex = i;
        }
    }

    if (largestWidthIndex == -1) {
        return null;
    }
    return this.staves[largestWidthIndex];
};

/**
 * Calculates the minimum distance between consecutive systems.
 *
 * @returns {int} smallest Y distance between consecutive systems
 */
Toe.Model.Page.prototype.getSmallestYDistanceBetweenStaves = function() {
    var minimumYDistance = 0;
    if (this.staves.length == 1) {
        minimumYDistance = this.staffAverageHeight / 2;
    }
    else if (this.staves.length > 1) {
        minimumYDistance = this.staves[1].getDistanceFromStaff(this.staves[0]);
        for (var i = 2; i < this.staves.length ; i++) {
            var distanceY = this.staves[i].getDistanceFromStaff(this.staves[i - 1]);
            minimumYDistance = distanceY < minimumYDistance ? distanceY : minimumYDistance;
        }
    }
    return minimumYDistance < 0 ? 0 : minimumYDistance;
};

// helper function to parse bounding box information
// "static" function
Toe.Model.Page.prototype.parseBoundingBox = function(zoneFacs) {
    // cache page reference
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
