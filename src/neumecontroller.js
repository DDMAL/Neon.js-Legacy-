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
 * Creates a new neume controller and listens to the model and the view
 *
 * @class Controller for the neume
 * @param {Toe.Model.Neume} pModel The neume model
 * @param {Toe.View.Neume} pView The neume view
 */
Toe.Ctrl.NeumeController = function(nModel, nView) {
    // LISTEN TO THE VIEW
    $(nModel).bind("mUpdateBoundingBox", function(event, nDrawing) {
        // get final bounding box from drawing
        var ulx = nDrawing.left - nDrawing.currentWidth/2;
        var uly = nDrawing.top - nDrawing.currentHeight/2;
        var lrx = ulx + nDrawing.currentWidth;
        var lry = uly + nDrawing.currentHeight;

        // reset the bounding box in the model with the final bounding box
        // of the drawing
        nModel.setBoundingBox([ulx, uly, lrx, lry]);
    });

    // LISTEN TO THE MODEL
    /** 
     * @event
     * event type: vRenderNeume
     * @param {Toe.Model.Neume} neume Neume to render
     * @param {Toe.Model.Staff} staff Staff the neume is on
     */
    $(nModel).bind("vRenderNeume", function(event, neume, staff) {
        // make sure neume type is known for it to be drawn properly
        if (!neume.props.type) {
            neume.deriveName();
        }

        var clef = staff.getActingClefByEle(neume);
        var clef_y = staff.zone.uly - clef.props.staffPos*staff.delta_y/2;

        // derive positions of neume components
        var nc_y = new Array();

        // set root note y pos
        nc_y.push(clef_y + (-neume.rootDiff * staff.delta_y/2));
        for (var i = 1; i < neume.components.length; i++) {
            nc_y.push(nc_y[0] + (-neume.components[i].pitchDiff * staff.delta_y/2));
        }

        nView.renderNeume(neume, nc_y, staff);
    });
}

Toe.Ctrl.NeumeController.prototype.constructor = Toe.Ctrl.NeumeController;
