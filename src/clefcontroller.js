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
 * Creates a new clef controller and listens to the model and the view
 *
 * @class Controller for the clef
 * @param {Toe.Model.Clef} pModel The clef model
 * @param {Toe.View.Clef} pView The clef view
 */
Toe.Ctrl.ClefController = function(cModel, cView) {
    // LISTEN TO THE VIEW
    $(cModel).bind("mUpdateBoundingBox", function(event, drawing) {
        // get final bounding box from drawing
        var ulx = drawing.left - drawing.currentWidth/2;
        var uly = drawing.top - drawing.currentHeight/2;
        var lrx = ulx + drawing.currentWidth;
        var lry = uly + drawing.currentHeight;

        // reset the bounding box in the model with the final bounding box
        // of the drawing
        cModel.setBoundingBox([ulx, uly, lrx, lry]);
    });

    // LISTEN TO THE MODEL
    /** 
     * @event
     * event type: vRenderClef
     * @param {Toe.Model.Clef} clef Clef to render
     */
    $(cModel).bind("vRenderClef", function(event, clef) {
        if (Toe.debug) {
            cView.renderClefBoundingBox(clef);
        }

        cView.renderClef(clef);
    });

    $(cModel).bind("vUpdateShape", function(event, clef) {
        cView.updateShape(clef);
    });

    $(cModel).bind("vUpdateStaffPosition", function(event, clef) {
        cView.updateStaffPosition(clef);
    });

    $(cModel).bind("vSelectDrawing", function(event) {
        cView.selectDrawing();
    });
}

Toe.Ctrl.ClefController.prototype.constructor = Toe.Ctrl.ClefController;
