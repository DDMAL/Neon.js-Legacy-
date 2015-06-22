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
 * Manages the GUI creation and interactions
 *
 * @class GUI handling
 * @param {Object} guiToggles Boolean values toggling instantiation of GUI elements
 */
Toe.View.GUI = function(apiprefix, meipath, rendEng, guiToggles) {
    var toggles = {
        sldr_bgImgOpacity: true,
        sldr_glyphOpacity: true,
        initGlyphOpacity: 1.0,
        initBgImgOpacity: 0.60
    };

    $.extend(toggles, guiToggles);

    this.rendEng = rendEng;
    this.apiprefix = apiprefix;
    this.meipath = meipath;

    this.setupNavBar();

    var parentDivId = "#gui-sidebar";
    this.setupSideBar(parentDivId, toggles);

    this.bindHotkeys();

    this.rendEng.repaint();
}

Toe.View.GUI.prototype.constructor = Toe.View.GUI;

/**
 * Inject HTML navbar links
 *
 * @methodOf Toe.View.GUI
 */
Toe.View.GUI.prototype.setupNavBar = function() {
    var gui = this;

    var nav_file_dropdown_parent = "#nav_file_dropdown";
    // check if the file menu is included in the template (avoid including bootstrap.js if possible)
    if ($(nav_file_dropdown_parent).length) {
        $(nav_file_dropdown_parent).append('<li><a id="nav_file_dropdown_revert" href="#">Revert</a></li><li class="divider"></li>' +
                                           '<li><a id="nav_file_dropdown_getmei" href="#">Get MEI</a></li>' +
                                           '<li><a id="nav_file_dropdown_getimg" href="#">Get Score Image</a></li>');


        $("#nav_file_dropdown_revert").tooltip({animation: true,
                                                placement: 'right',
                                                title: 'Revert the current MEI file to the original version. ' +
                                                       'Warning: this will revert all changes made in the editor.',
                                                delay: 100});
        $("#nav_file_dropdown_revert").click(function() {
            // move backup mei file to working directory
            $.post(gui.apiprefix + "/revert", function(data) {
                // when the backup file has been restored, reload the page
                window.location.reload();
            })
            .error(function() {
                // show alert to user
                // replace text with error message
                $("#alert > p").text("Server failed to restore backup MEI file.");
                $("#alert").animate({opacity: 1.0}, 100);
            });
        });

        // MEI download
        $("#nav_file_dropdown_getmei").tooltip({animation: true,
                                                placement: 'right',
                                                title: 'View the MEI file of the document being edited.',
                                                delay: 100});
        // set the download path of the file
        $("#nav_file_dropdown_getmei").attr("href", gui.meipath);

        // Document image rasterize
        $("#nav_file_dropdown_getimg").tooltip({animation: true,
                                                placement: 'right',
                                                title: 'Download an image of the document being edited.',
                                                delay: 100});
        $("#nav_file_dropdown_getimg").click(function() {
            if (!fabric.Canvas.supports('toDataURL')) {
                // show alert to user
                $("#alert > p").text("The browser you are using does not support this feature.");
            }
            else {
                window.open(gui.rendEng.canvas.toDataURL('png'));
            }
        });
    }
}

Toe.View.GUI.prototype.setupSideBar = function(parentDivId, toggles) {
    // cache instance variable
    var gui = this;

    // create container for appearance sliders
    if (toggles.sldr_bgImgOpacity || toggles.sldr_glyphOpacity) {
        $(parentDivId).prepend('<span id="sidebar-app"><li class="nav-header">Appearance</li>\n</span>');

        // create background image opacity slider
        if (toggles.sldr_bgImgOpacity) {
            $("#sidebar-app").append('<li>\n<label for="sldr_bgImgOpacity"><b>Image Opacity</b>:</label>\n' +
                                   '<input id="sldr_bgImgOpacity" style="width: 95%;" type="range" name="bgImgOpacity" ' +
                                   'min="0.0" max="1.0" step="0.05" value="' + toggles.initBgImgOpacity + '" />\n</li>');

            $("#sldr_bgImgOpacity").bind("change", function() {
                gui.rendEng.canvas.backgroundImageOpacity = $(this).val();
                gui.rendEng.repaint();
            });
        }

        // create glyph opacity slider
        if (toggles.sldr_glyphOpacity) {
            $("#sidebar-app").append('<li>\n<label for="sldr_glyphOpacity"><b>Glyph Opacity</b>:</label>\n' +
                                   '<input id="sldr_glyphOpacity" style="width: 95%;" type="range" name="glyphOpacity" ' +
                                   'min="0.0" max="1.0" step="0.05" value="' + toggles.initGlyphOpacity + '" />\n</li>');

            $("#sldr_glyphOpacity").bind("change", function() {
                var opacity = $(this).val();
                gui.rendEng.canvas.forEachObject(function(obj) {
                    obj.setOpacity(opacity);
                });

                gui.rendEng.repaint();
            });
        }
    }
}

Toe.View.GUI.prototype.bindHotkeys = function() {
    // edit mode hotkey
    Mousetrap.bind(['e', 'Ctrl+e', 'Command+e'], function() {
        $("#btn_edit").click();
        return false;
    });

    // insert mode hotkey
    Mousetrap.bind(['i', 'Ctrl+i', 'Command+i'], function() {
        $("#btn_insert").click();
        return false;
    });
}
