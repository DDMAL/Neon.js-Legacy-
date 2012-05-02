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
 * Creates a new page
 *
 * @class Represents a page of music
 */
Toe.Model.Page = function() {
    // initialize staves
    this.staves = new Array();
}

Toe.Model.Page.prototype.constructor = Toe.Model.Page;

/**
 * Set canvas width and height directly
 *
 * @methodOf Toe.Model.Page
 * @param {Number} width Width of the page
 * @param {Number} height Height of the page
 */
Toe.Model.Page.prototype.setDimensions = function(width, height) {
    this.width = width;
    this.height = height;
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
 * Given coordinates, find the index of the closest staff
 *
 * @methodOf Toe.Model.Page
 * @param {Object} coords {x: , y:}
 * @returns {Number} sInd
 */
Toe.Model.Page.prototype.getClosestStaff = function(coords) {
    var sInd = this.staves.length-1;
    // for each staff, except the last
    for (var i = 0; i < this.staves.length-1; i++) {
        if (coords.y < this.staves[i].zone.lry + (this.staves[i+1].zone.uly - this.staves[i].zone.lry)/2) {
            // this is the correct staƒf
            sInd = i;
            break;
        }
    }
    return this.staves[sInd];
}

/**
 * Given a staff, get the next staff on the page
 *
 * @methodOf Toe.Model.Page
 * @param {Toe.Model.Staff} staff 
 * @returns {Staff} nextStaff the next staff
 */
Toe.Model.Page.prototype.getNextStaff = function(staff) {
    // for each staff, except the last
    for (var i = 0; i < this.staves.length-1; i++) {
        if (staff == this.staves[i]) {
            return this.staves[i+1];
        }
    }

    return null;
}

/**
 * Adds a given number of staves to the page
 *
 * @methodOf Toe.Model.Page
 * @param {Toe.Model.Staff} staff the staff to add to the model
 * @returns {Toe.Model.Page} pointer to the current page for chaining
 */
Toe.Model.Page.prototype.addStaff = function(staff) {
    this.staves.push(staff);

	// update view
	$(staff).trigger("vRenderStaff", [staff]);

    return this;
}
