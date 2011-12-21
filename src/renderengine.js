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
 * @requires Toe
 * @class 
 * 
 */
Toe.RenderEngine = function(options) {
    this.options = {
        globScale: 0.08
    };

    $.extend(this.options, options);
}

Toe.RenderEngine.prototype.constructor = Toe.RenderEngine;

Toe.RenderEngine.prototype.setGlyphs = function(glyphs) {
    this.glyphs = glyphs;
}

Toe.RenderEngine.prototype.setCanvas = function(f_canvas) {
    this.canvas = f_canvas;
}

Toe.RenderEngine.prototype.getGlyph = function(svgKey) {
    return this.glyphs[svgKey];
}

Toe.RenderEngine.prototype.draw = function(elements, modify) {
    if (modify) {
        elements = this.preprocess(elements);
    }

    for(var i = 0; i < elements.length; i++) {
        this.canvas.add(elements[i]);
    }
}

Toe.RenderEngine.prototype.preprocess = function(elements) {
    // global transformations go here (ie., global scale, translation, rotation)
    for (var i = 0; i < elements.length; i++) {
        elements[i] = elements[i].scale(this.options.globScale);
    }

    return elements;
}
