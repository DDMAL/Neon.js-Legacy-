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
 * Manages the GUI creation and interactions
 *
 * @class GUI handling
 * @param {Object} guiToggles Boolean values toggling instantiation of GUI elements
 */
Toe.View.GUI = function(prefix, fileName, rendEng, guiToggles) {
    var toggles = {
        sldr_bgImgOpacity: true,
        initBgImgOpacity: 0.60,
        btn_neumify: true,
        btn_delete: true,
        btn_explode: true,
        radio_mode: true,
        initMode: "edit"
    };

    $.extend(toggles, guiToggles);

    var parentDivId = "#gui";

    // create background image opacity slider
    if (toggles.sldr_bgImgOpacity) {
        $(parentDivId).append('<label for="sldr_bgImgOpacity">Background Image Opacity:</label><div id="sldr_bgImgOpacity"></div>');
        $("#sldr_bgImgOpacity").slider({
            min: 0.0,
            max: 1.0,
            step: 0.05,
            value: toggles.initBgImgOpacity
        });

        $("#sldr_bgImgOpacity").bind("slide", function(event, ui) {
            rendEng.canvas.backgroundImageOpacity = ui.value;
            rendEng.repaint();
        });
    }

    $(parentDivId).append('<span id="toolbar" class="ui-widget-header ui-corner-all">');

    var parentDivId = "#toolbar";

    if (toggles.btn_neumify) {
        $(parentDivId).append('<button id="btn_neumify">Neumify</button>');
        $("#btn_neumify").button();
    }

    if (toggles.btn_delete) {
        $(parentDivId).append('<button id="btn_delete">Delete</button>');
        $("#btn_delete").button();
    }

    if (toggles.btn_explode) {
        $(parentDivId).append('<button id="btn_explode">Explode</button>');
        $("#btn_explode").button();
    }

    if (toggles.radio_mode) {
        var editCheck = "";
        var insertCheck = "";
        if (toggles.initMode == "edit") {
            editCheck = 'checked="checked"';
        }
        else {
            insertCheck = 'checked="checked"';
        }

        $(parentDivId).append('<span id="mode">');
        $("#mode").append('<input type="radio" id="radio_insertMode" name="mode" ' + insertCheck + '/><label for="radio_insertMode">Insert Mode</label>');
        $("#mode").append('<input type="radio" id="radio_editMode" name="mode" ' + editCheck + '/><label for="radio_editMode">Edit Mode</label>');
        $(parentDivId).append('</span>');

        // jquerify the radio buttons
        $("#mode").buttonset();
    }

    $(parentDivId).append('</span>');
}

Toe.View.GUI.prototype.constructor = Toe.View.GUI;

