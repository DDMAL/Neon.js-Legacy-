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
 * Creates a new system controller and listens to the model and the view
 *
 * @class Controller for the system
 * @param {Toe.Model.SystemView} pModel system model
 * @param {Toe.View.System} pView system view
 */
Toe.Ctrl.SystemController = function(sModel, sView) {
    /** 
     * @event
     * event type: vRenderSystem
     * @param {Toe.Model.System} aSystem system to render
     */
    $(sModel).bind("vRenderSystem", function(event, aSystem) {
        if (Toe.debug) {
            sView.renderSystemBoundingBox(aSystem);
        }
        sView.renderSystem(aSystem);
    });
    Toe.Ctrl.Controller.call(this, sModel, sView);
};

Toe.Ctrl.SystemController.prototype = new Toe.Ctrl.Controller();
Toe.Ctrl.SystemController.prototype.constructor = Toe.Ctrl.SystemController;

/**
 * Handles dimension and position change.
 *
 * @param {float} aWidth new width
 * @param {float} aHeight new height
 * @param {float} aXLeft new x-left position
 * @param {float} aYTop new y-top position
 */
Toe.Ctrl.SystemController.prototype.modifyDimensions = function(aWidth, aHeight, aXLeft, aYTop) {

    var boundingBox = [aXLeft, aYTop, aXLeft + aWidth, aYTop + aHeight];
    this.model.setBoundingBox(boundingBox);
};

/**
 * Modifies zone according to the left and width.
 *
 * @param {float} aCenterX  new horizontal center
 * @param {float} aWidth    new width
 */
Toe.Ctrl.SystemController.prototype.modifyZone = function(aCenterX, aWidth) {

    var boundingBox = [aCenterX - aWidth / 2,
                       this.model.zone.uly,
                       aCenterX + aWidth / 2,
                       this.model.zone.lry];
    this.model.setBoundingBox(boundingBox);
};
