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

        var rootDiff = neume.getRootDifference(staff);
        var clef_y = staff.clef.y;

        // derive positions of neume components
        var nc_y = new Array();

        // set root note y pos
        nc_y.push(clef_y + ((~rootDiff + 1) * staff.delta_y / 2));
        for (var i = 1; i < neume.components.length; i++) {
            nc_y.push(nc_y[0] + ((~neume.components[i].diff + 1) * staff.delta_y/2));
        }

        nView.renderNeume(neume, nc_y);
    });
}

Toe.Ctrl.NeumeController.prototype.constructor = Toe.Ctrl.NeumeController;
