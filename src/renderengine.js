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
Toe.View.RenderEngine = function(options) {
    this.options = {
        globScale: 0.08
    };

    $.extend(this.options, options);
}

Toe.View.RenderEngine.prototype.constructor = Toe.View.RenderEngine;

/**
 * Set the glyph set for the rendering engine
 * @param {Object} glyphs Dictionary set of Toe.View.Glyph objects imported from SVG
 */
Toe.View.RenderEngine.prototype.setGlyphs = function(glyphs) {
    this.glyphs = glyphs;
}

/**
 * Set the context to draw on
 * @param {Object} f_canvas The Fabric.js canvas
 */
 Toe.View.RenderEngine.prototype.setCanvas = function(f_canvas) {
    this.canvas = f_canvas;
    
    // set canvas properties
    this.canvas.HOVER_CURSOR = "pointer";

    // set selection line width
    this.canvas.selectionLineWidth = 2;
    this.canvas.selectionBorderColor = 'black';
}

Toe.View.RenderEngine.prototype.setGlobalScale = function(scale) {
	this.options.globScale = scale;

	// update glyph dimension caches
	$.each(this.glyphs, function(it, el) {
		el.centre = [el.centre[0]*scale, el.centre[1]*scale];
	});
}

// get global scale
Toe.View.RenderEngine.prototype.getGlobalScale = function() {
    return this.options.globScale;
}

/**
 * Getter for glyph accesses from musical elements
 * @param {String} svgKey lookup key to attain the glyph
 */
Toe.View.RenderEngine.prototype.getGlyph = function(svgKey) {
    return this.glyphs[svgKey];
}

Toe.View.RenderEngine.prototype.calcScaleFromStaff = function(staff, options) {
	opts = {
		overwrite: false
	};

	$.extend(opts, options);

	var delta_y = staff.zone.lry - staff.zone.uly;
	var height = delta_y / (staff.props.numLines-1);
 
	// clef spans 2 stafflines with 40% height (pixels) verticle buffer, 20% on each space
	height = (height * 2) - (0.65*height);

	var glyph = this.getGlyph("c_clef").clone();
	var glyphHeight = glyph.height;

	scale = Math.abs(height / glyphHeight);

	if (opts.overwrite) {
		this.setGlobalScale(scale);
	}
	
	return scale;
}

/*
 * Calculate the glyph scaling from the bounding box of a neume. The neume should
 * be an elementary neume such as a punctum, such that the scaling of the individual 
 * SVG glyph can be calculated from the bounding box of the neume from the MEI document.
 * This is the method of calculating the glyph scaling for staffless neume
 * notation, where the distance between stafflines is not available to calculate the 
 * proper glyph scalings.
 */
Toe.View.RenderEngine.prototype.calcScaleFromNeume = function(neume, options) {
    opts = {
        overwrite: false
    };

    $.extend(opts, options);

    var glyph = this.getGlyph(neume.typeid).clone();
    var glyphHeight = glyph.height;

    var zoneHeight = neume.zone.lry - neume.zone.uly;

    var scale = Math.abs((neume.zone.lry - neume.zone.uly) / glyph.height);

    if (opts.overwrite) {
        this.setGlobalScale(scale);
    }

    return scale;
}

// [x1, y1, x2, y2]
Toe.View.RenderEngine.prototype.createLine = function(coords, options) {
	var opts = {
		fill: "rgb(0,0,0)",
		strokeWidth: 3,
        opacity: 1.0,
		interact: false
	};
	$.extend(opts, options);

	return new fabric.Line(coords, {
		fill: opts.fill,
        stroke: opts.fill,
        strokeWidth: opts.strokeWidth,
        opacity: opts.opacity,
        selectable: opts.interact
    });
}

// [ulx, uly, lrx, lry]
Toe.View.RenderEngine.prototype.outlineBoundingBox = function(bb, options) {
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
		opacity: opts.opacity 
	});

    var elements = {fixed: new Array(), modify: new Array()};
    elements.fixed.push(bb);

	this.draw(elements, {selectable: opts.interact, opacity: opts.opacity});
}

/**
 * Draws the elements to the Fabric.js canvas and applies any global transformations
 * @param {Array} elements Array of fabric objects to draw
 * @param {Boolean} modify Perform global transformations on this element set
 */
Toe.View.RenderEngine.prototype.draw = function(elements, options) {
	var opts = {
		modify: true,
		repaint: false,
        group: false,
        selectable: true,
        hasControls: false,
        hasBorders: false,
        lockMovementX: false,
        lockMovementY: false,
        opacity: 1.0,
        eleRef: null
	};

	$.extend(opts, options);

    // perform transformations
    elements.modify = this.preprocess(elements.modify);

    // merge transformed elements with fixed elements
    elements = $.merge($.merge([],elements.modify), elements.fixed);

    // make group if specified
    if (opts.group) {
        elements = [new fabric.Group(elements)];
    }

    // apply control options to outer container
    $.map(elements, function(val, i) {
        val.selectable = opts.selectable;
        val.hasControls = opts.hasControls;
        val.lockRotation = true;
        val.lockScale = true;
        val.lockMovementX = opts.lockMovementX;
        val.lockMovementY = opts.lockMovementY;
        val.borderColor = 'rgba(102,153,255,1.0)';
        val.opacity = opts.opacity;
        val.eleRef = opts.eleRef; // important: attaches element reference to fabric group
    });

    // add the elements to the canvas
    for(var i = 0; i < elements.length; i++) {
        this.canvas.add(elements[i]);
    }

    // force repaint of canvas if necessary
	if (opts.repaint) {
		this.repaint();
	}

    // return the final drawings
    return elements;
}

// wrapper for fabric canvas unobserve event listener
Toe.View.RenderEngine.prototype.unObserve = function(event) {
    this.canvas.off(event);
}

Toe.View.RenderEngine.prototype.repaint = function() {
	this.canvas.renderAll();
}

/**
 * Perform global transformations (ie., scale, translation, rotation) to element set
 * @param {Array} elements Array of fabric objects to transform
 */
Toe.View.RenderEngine.prototype.preprocess = function(elements) {
    // global transformations go here 
    for (var i = 0; i < elements.length; i++) {
        elements[i] = elements[i].scale(this.options.globScale);
		
		// set current width & height
		elements[i].currentWidth = elements[i].currentWidth*this.options.globScale;
		elements[i].currentHeight = elements[i].currentHeight*this.options.globScale;
    }

    return elements;
}
