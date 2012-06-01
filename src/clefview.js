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
 * Creates a new clef view
 *
 * @class View for the clef
 * @param {Toe.View.RenderEngine} renderEngine The rendering engine
 */
Toe.View.ClefView = function(renderEngine) {
    this.rendEng = renderEngine;
}

Toe.View.ClefView.prototype.constructor = Toe.View.ClefView;

/**
 * Renders the clef according to the following scheme:
 *  <ulx,uly> =======
 *            ------- (line numLines)
 *            ------- (line numLines-1)
 *            ------- ...
 *            ------- (line 1)
 *            ======= <lrx,lry>
 * 
 * @methodOf Toe.View.ClefView
 * @param {Toe.Model.Clef} clef Clef to render
 */
Toe.View.ClefView.prototype.renderClef = function(clef, staff) {
    if (!this.rendEng) {
        throw new Error("Clef: Invalid render context");
    }
    
    var elements = {static: new Array(), modify: new Array()};

    var svgKey = null;
    switch(clef.shape) {
        case "c":
            svgKey = "c_clef";
            break;
        case "f":
            svgKey = "f_clef";
            break;
    }

    var cGlyph = this.rendEng.getGlyph(svgKey);
    var svgClef = cGlyph.clone().set({left: clef.x + cGlyph.centre[0], top: clef.y}); // offset centre

    elements.modify.push(svgClef);

    this.rendEng.draw(elements, {group: true, selectable: clef.props.interact, staffRef: staff, eleRef: clef});
}
