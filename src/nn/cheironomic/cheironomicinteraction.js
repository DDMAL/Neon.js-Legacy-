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

Toe.View.CheironomicInteraction = function(rendEng, page, apiprefix, guiToggles) {
    var toggles = {
        initMode: "edit"
    };

    $.extend(toggles, guiToggles);

    this.rendEng = rendEng;
    this.page = page;
    this.apiprefix = apiprefix;

    // pointer to the the punctum drawing in insert mode
    this.punctDwg = null;

    /*
     * cache height and width of punctum glyph for use
     * in bounding box estimation in neumify and ungroup
     * and insert ornamentation spacing
     */
    var punctGlyph = rendEng.getGlyph("punctum").clone();
    this.punctWidth = punctGlyph.width*rendEng.getGlobalScale();
    this.punctHeight = punctGlyph.height*rendEng.getGlobalScale();

    this.objMoving = false;
    var parentDivId = "#gui-sidebar";

    // switch to edit mode
    $("#btn_edit").bind("click.edit", {gui: this, parentDivId: parentDivId}, this.handleEdit);

    // switch to insert mode
    $("#btn_insert").bind("click.insert", {gui: this, parentDivId: parentDivId}, this.handleInsert);

    // set active button on startup
    $("#btn_" + toggles.initMode).trigger('click');
}

Toe.View.CheironomicInteraction.prototype.constructor = Toe.View.CheironomicInteraction;

/**************************************************
 *                  EDIT                          *
 **************************************************/
Toe.View.CheironomicInteraction.prototype.handleEdit = function(e) {
}

Toe.View.CheironomicInteraction.prototype.handleInsert = function(e) {
}
