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
 * Creates a new Custos controller that listens to the model and the view
 *
 * @class Controller for the Custos
 * @param {Toe.Model.Custos} cModel The Custos model
 * @param {Toe.View.Custos} cView The Custos view
 */
Toe.Ctrl.CustosController = function(cModel, cView) {
    // LISTEN TO THE VIEW

    // LISTEN TO THE MODEL
    /** 
     * @event
     * event type: vRenderCustos
     * @param {Toe.Model.Custos} custos Custos to render
     */
    $(cModel).bind("vRenderCustos", function(event, custos) {
        // get the staff this custos is mounted on
        var staff = custos.staff;

        // calculate the y position of the custos
        var custos_y = staff.zone.uly - custos.rootStaffPos*staff.delta_y/2;

        cView.renderCustos(custos, custos_y);
    });

    $(cModel).bind("vSelectDrawing", function(event) {
        cView.selectDrawing();
    });
}

Toe.Ctrl.CustosController.prototype.constructor = Toe.Ctrl.CustosController;
