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
 * Creates a new page view
 *
 * @class View for the page
 * @param {Toe.View.RenderEngine} renderEngine The rendering engine
 */
Toe.View.PageView = function(renderEngine) {
    this.rendEng = renderEngine;
};

Toe.View.PageView.prototype = new Toe.View.View();
Toe.View.PageView.prototype.constructor = Toe.View.PageView;

/**
 * Sets the dimensions of the page
 *
 * @methodOf Toe.View.PageView
 * @param {Number} width Width of the page
 * @param {Number} height Height of the page
 */
Toe.View.PageView.prototype.setDimensions = function(width, height) {
    this.canvas.setDimensions({width: width, height: height});
};
