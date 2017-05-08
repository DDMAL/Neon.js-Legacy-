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
 * Creates a new page controller and listens to the model and the view
 *
 * @class Controller for the page
 * @param {Toe.Model.Page} pModel The page model
 * @param {Toe.View.Page} pView The page view
 */
 Toe.Ctrl.PageController = function(pModel, pView) {
    // LISTEN TO THE VIEW
    /** 
     * @event
     * event type: mSetDimensions.ui
     * @param {Number} width width of the page
     * @param {Number} height height of the page
     */
    $(pView).bind("mSetDimensions.ui", function(event, width, height) {
        pModel.setDimensions(width, height);
    });

    // LISTEN TO THE MODEL
    /** 
     * @event
     * event type: vSetDimensions
     * @param {Number} width width of the page
     * @param {Number} height height of the page
     */
    $(pModel).bind("vSetDimensions", function(event, width, height) {
        pView.setDimensions(width, height);
    });
    Toe.Ctrl.Controller.call(this, pModel, pView);
};

Toe.Ctrl.PageController.prototype = new Toe.Ctrl.Controller();
Toe.Ctrl.PageController.prototype.constructor = Toe.Ctrl.PageController;
