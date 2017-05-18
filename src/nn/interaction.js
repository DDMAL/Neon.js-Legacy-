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
 * Generic interaction view.
 */
Toe.View.Interaction = function(rendEng, page, apiprefix, guiToggles) {
    this.rendEng = rendEng;
    this.page = page;
    this.apiprefix = apiprefix;
};

Toe.View.Interaction.prototype.constructor = Toe.View.Interaction;


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GUI Management Methods
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
Toe.View.Interaction.prototype.showInfo = function(aText) {
    $("#info").animate({opacity: 1.0}, 100);
    $("#info > p").html(aText);
    $("#info").fadeIn(400);
};

Toe.View.Interaction.prototype.hideInfo = function() {
    $("#info").fadeOut(400);
};

Toe.View.Interaction.prototype.showAlert = function(aText) {
    $("#alert > p").text(aText);
    $("#alert").animate({opacity: 1.0}, 100);
};

Toe.View.Interaction.prototype.deactivateCanvasObjects = function() {
    this.rendEng.canvas.selection = false;
    this.rendEng.canvas.deactivateAll();
    this.rendEng.canvas.HOVER_CURSOR = null;
};

Toe.View.Interaction.prototype.activateCanvasObjects = function() {
    this.rendEng.canvas.selection = true;
    this.rendEng.canvas.HOVER_CURSOR = "pointer";
};

Toe.View.Interaction.prototype.removeInsertControls = function() {
    $("#sidebar-insert").remove();
};

Toe.View.Interaction.prototype.removeEditControls = function() {
    $("#sidebar-edit").remove();
};

Toe.View.Interaction.prototype.unbindEventHandlers = function() {
    this.rendEng.unObserve("mouse:down");
    this.rendEng.unObserve("mouse:up");
    this.rendEng.unObserve("mouse:move");
    this.rendEng.unObserve("object:moving");
    this.rendEng.unObserve("object:selected");
    this.rendEng.unObserve("selection:cleared");
    this.rendEng.unObserve("selection:created");
    this.rendEng.unObserve("object:modified");
};