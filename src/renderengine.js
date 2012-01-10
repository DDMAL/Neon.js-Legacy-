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
 * Rendering engine for canvas objects and glyphs
 * @requires Toe
 * @class Rendering engine
 * @param {Object} options globScale {Number}
 */
Toe.RenderEngine = function(options) {
    this.options = {
        globScale: 0.08
    };

    $.extend(this.options, options);
}

Toe.RenderEngine.prototype.constructor = Toe.RenderEngine;

/**
 * Set the glyph set for the rendering engine
 * @param {Object} glyphs Dictionary set of Toe.Glyph objects imported from SVG
 */
Toe.RenderEngine.prototype.setGlyphs = function(glyphs) {
    this.glyphs = glyphs;
}

/**
 * Set the context to draw on
 * @param {Object} f_canvas The Fabric.js canvas
 */
Toe.RenderEngine.prototype.setCanvas = function(f_canvas) {
    this.canvas = f_canvas;
}

/**
 * Getter for glyph accesses from musical elements
 * @param {String} svgKey lookup key to attain the glyph
 */
Toe.RenderEngine.prototype.getGlyph = function(svgKey) {
    return this.glyphs[svgKey];
}

// TODO: instead of sysfacs, pass in first Toe.Staff
Toe.RenderEngine.prototype.calcScaleFromStaff = function(sysFacs, options) {
	opts = {
		overwrite: false
	};

	$.extend(opts, options);

	var delta_y = parseInt($(sysFacs).attr("lry")) - parseInt($(sysFacs).attr("uly"));
	var height = delta_y / 5;
 
	// clef spans 2 stafflines with 4 pixel verticle buffer
	height = (height * 2) - 4;

	var glyph = this.getGlyph("c_clef").clone();
	var glyphHeight = glyph.height;

	scale = Math.abs(height / glyphHeight);

	if (opts.overwrite) {
		this.options.globScale = scale;
	}
	
	console.log("setting global scale: " + this.options.globScale);

	return scale;
}

// [x1, y1, x2, y2]
Toe.RenderEngine.prototype.createLine = function(coords, options) {
	var opts = {
		fill: "rgb(0,0,0)",
		strokeWidth: 1,
		interact: false
	};
	$.extend(opts, options);

	return new fabric.Line(coords, {
		fill: opts.fill,
        strokeWidth: opts.strokeWidth,
        selectable: opts.interact
    });
}

// [ulx, uly, lrx, lry]
Toe.RenderEngine.prototype.outlineBoundingBox = function(bb, options) {
	var opts = {
		fill: "rgb(0,255,0)",
		opacity: 0.65,
		interact: false
	};
	$.extend(opts, options);

	var width = bb[2] - bb[0];
	var height = bb[3] - bb[1];
	var bb = new fabric.Rect({
		width: width, 
		height: height, 
		left: bb[0] + (width/2), // weird fabric bug
		top: bb[1] + (height/2), // weird fabric bug
		fill: opts.fill, 
		opacity: opts.opacity, 
		selectable: opts.interact
	});

	this.draw([bb], false);
}

/**
 * Draws the elements to the Fabric.js canvas and applies any global transformations
 * @param {Array} elements Array of fabric objects to draw
 * @param {Boolean} modify Perform global transformations on this element set
 */
Toe.RenderEngine.prototype.draw = function(elements, modify) {
    if (modify) {
        elements = this.preprocess(elements);
    }

    for(var i = 0; i < elements.length; i++) {
        this.canvas.add(elements[i]);
    }
}

/**
 * Perform global transformations (ie., scale, translation, rotation) to element set
 * @param {Array} elements Array of fabric objects to transform
 */
Toe.RenderEngine.prototype.preprocess = function(elements) {
    // global transformations go here 
    for (var i = 0; i < elements.length; i++) {
        elements[i] = elements[i].scale(this.options.globScale);
    }

    return elements;
}
