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

    this.bindHotKeys();
}

Toe.View.CheironomicInteraction.prototype.constructor = Toe.View.CheironomicInteraction;

/**************************************************
 *                  EDIT                          *
 **************************************************/
Toe.View.CheironomicInteraction.prototype.handleEdit = function(e) {
    var gui = e.data.gui;
    var parentDivId = e.data.parentDivId;

    // activate all objects on the canvas 
    // so they can be modified in edit mode
    gui.rendEng.canvas.selection = true;
    gui.rendEng.canvas.HOVER_CURSOR = "pointer";

    // first remove insert options
    $("#sidebar-insert").remove();

    // unbind insert event handlers
    gui.rendEng.unObserve("mouse:move");
    gui.rendEng.unObserve("mouse:up");

    // remove drawings following the pointer from insert mode
    if (gui.punctDwg) {
        gui.rendEng.canvas.remove(gui.punctDwg);
    }
    gui.rendEng.repaint();
           
    // add buttons for edit commands
    if ($("#sidebar-edit").length == 0) {
        $(parentDivId).append('<span id="sidebar-edit"><br/><li class="divider"></li><li class="nav-header">Edit</li>\n' +
                              '<li>\n<button id="btn_delete" class="btn"><i class="icon-remove"></i> Delete</button>\n</li>\n' +
                              '<li>\n<div class="btn-group">\n<button id="btn_neumify" class="btn"><i class="icon-magnet"></i> Neumify</button>\n' +
                              '<button class="btn dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>\n' +
                              '<ul class="dropdown-menu"><li><a id="btn_neumify_liquescence">liquescence</a></li></ul></li>\n' +
                              '<li><button id="btn_ungroup" class="btn"><i class="icon-share"></i> Ungroup</button></li>\n</div>\n</span>');
    }
    
    // grey out edit buttons by default
    $('#btn_delete').toggleClass('disabled', true);
    $('#btn_neumify').toggleClass('disabled', true);
    $('#btn_neumify_liquescence').toggleClass('disabled', true);
    $('#btn_ungroup').toggleClass('disabled', true);

    gui.rendEng.canvas.observe('mouse:down', function(e) {
        // cache pointer coordinates for mouse up
        gui.downCoords = gui.rendEng.canvas.getPointer(e.e);
    });

    gui.rendEng.canvas.observe('object:moving', function(e) {
        gui.objMoving = true;
    });

    gui.rendEng.canvas.observe('selection:created', function(e) {
        var selection = e.target;
        selection.hasControls = false;
        selection.borderColor = 'rgba(102,153,255,1.0)';

        // disable/enable buttons
        var toNeumify = 0;
        var toUngroup = 0;
        var sModel = null;
        $.each(selection.getObjects(), function (oInd, o) {
            // don't draw a selection border around each object in the selection
            o.borderColor = 'rgba(0,0,0,0)'; 

            if (o.eleRef instanceof Toe.Model.Neume) {
                if (!sModel) {
                    sModel = o.eleRef.staff;
                }
                
                toUngroup++;

                if (o.eleRef.staff == sModel) {
                    toNeumify++;
                }
            }
        });

        $('#btn_delete').toggleClass('disabled', false);

        if (toNeumify < 2) {
            $('#btn_neumify').toggleClass('disabled', true);
            $('#btn_neumify_liquescence').toggleClass('disabled', true);
        }
        else {
            $('#btn_neumify').toggleClass('disabled', false);
            $('#btn_neumify_liquescence').toggleClass('disabled', false);
        }

        if (toUngroup > 0) {
            $('#btn_ungroup').toggleClass('disabled', false);
        }
        else {
            $('#btn_ungroup').toggleClass('disabled', true);
        }
    });

    gui.rendEng.canvas.observe('object:selected', function(e) {
        $('#btn_delete').toggleClass('disabled', false);

        var selection = gui.rendEng.canvas.getActiveObject();
        var ele = selection.eleRef;
        if (ele instanceof Toe.Model.Neume) {
            $("#info > p").html("Selected: " + ele.name);
            $("#info").animate({opacity: 1.0}, 100);

            $('#btn_ungroup').toggleClass('disabled', false);

            $("#menu_editclef").remove();

            if (ele.typeid == "punctum" || ele.typeid == "tractulus" || ele.typeid == "cavum" || ele.typeid == "virga") {
                if ($("#menu_editpunctum").length == 0) {
                    $("#sidebar-edit").append('<span id="menu_editpunctum"><br/><li class="nav-header">Ornamentation</li>\n' +
                                              '<li><div class="btn-group" data-toggle="buttons-checkbox">\n' +
                                              '<button id="edit_chk_dot" class="btn">&#149; Dot</button>\n' +
                                              '<button id="edit_chk_horizepisema" class="btn"><i class="icon-resize-horizontal"></i> Episema</button>\n' +
                                              '<button id="edit_chk_vertepisema" class="btn"><i class="icon-resize-vertical"></i> Episema</button>\n</div></li>\n' + 
                                              '<br/><li class="nav-header">Attributes</li>\n' +
                                              '<li><div class="btn-group"><a class="btn dropdown-toggle" data-toggle="dropdown">\n' + 
                                              'Head shape <span class="caret"></span></a><ul class="dropdown-menu">\n' + 
                                              '<li><a id="head_punctum">punctum</a></li>\n' +
                                              '<li><a id="head_punctum_inclinatum">punctum inclinatum</a></li>\n' +
                                              '<li><a id="head_punctum_inclinatum_parvum">punctum inclinatum parvum</a></li>\n' +
                                              '<li><a id="head_cavum">cavum</a></li>\n' +
                                              '<li><a id="head_virga">virga</a></li>\n' +
                                              '<li><a id="head_quilisma">quilisma</a></li>\n' +
                                              '</ul></div></span>');
                }

                // toggle ornamentation
                var nc = ele.components[0];
                var hasDot = nc.hasOrnament("dot");
                if (hasDot) {
                    $("#edit_chk_dot").toggleClass("active", true);
                }
                else {
                    $("#edit_chk_dot").toggleClass("active", false);
                }

                // Handle dot toggles
                // remove onclick listener for previous selection
                $("#edit_chk_dot").unbind("click");
                $("#edit_chk_dot").bind("click.edit", {gui: gui, punctum: ele}, gui.handleDotToggle);

                // Handle head shape change
                $("#head_punctum").unbind("click");
                $("#head_cavum").unbind("click");
                $("#head_virga").unbind("click");
                $("#head_quilisma").unbind("click");
                $("#head_punctum_inclinatum").unbind("click");
                $("#head_punctum_inclinatum_parvum").unbind("click");
                $("#head_punctum").bind("click.edit", {gui: gui, punctum: ele, shape: "punctum"}, gui.handleHeadShapeChange);
                $("#head_cavum").bind("click.edit", {gui: gui, punctum: ele, shape: "cavum"}, gui.handleHeadShapeChange);
                $("#head_virga").bind("click.edit", {gui: gui, punctum: ele, shape: "virga"}, gui.handleHeadShapeChange);
                $("#head_quilisma").bind("click.edit", {gui: gui, punctum: ele, shape: "quilisma"}, gui.handleHeadShapeChange);
                $("#head_punctum_inclinatum").bind("click.edit", {gui: gui, punctum: ele, shape: "punctum_inclinatum"}, gui.handleHeadShapeChange);
                $("#head_punctum_inclinatum_parvum").bind("click.edit", {gui: gui, punctum: ele, shape: "punctum_inclinatum_parvum"}, gui.handleHeadShapeChange);
            }
            else {
                $("#menu_editpunctum").remove();
            }
        }
        else {
            $("#menu_editpunctum").remove();
        }
    });

    gui.rendEng.canvas.observe('selection:cleared', function(e) {
        // close info alert
        $("#info").animate({opacity: 0.0}, 100);

        // remove selection specific editing options
        $("#menu_editpunctum").remove();

        $('#btn_delete').toggleClass('disabled', true);
        $('#btn_neumify').toggleClass('disabled', true);
        $('#btn_neumify_liquescence').toggleClass('disabled', true);
        $('#btn_ungroup').toggleClass('disabled', true);
    });

    gui.rendEng.canvas.observe('mouse:up', function(e) {
        var upCoords = gui.rendEng.canvas.getPointer(e.e);

        // get delta of the mouse movement
        var delta_x = gui.downCoords.x - upCoords.x;
        var delta_y = gui.downCoords.y - upCoords.y;
        // don't perform dragging action if the mouse doesn't move
        if (!gui.objMoving) {
            return;
        }
        
        // if something is selected we need to do some housekeeping
        // check for single selection
        var selection = gui.rendEng.canvas.getActiveObject();
        if (!selection) {
            // check for group selection
            selection = gui.rendEng.canvas.getActiveGroup();
        }

        if (selection) {
            var elements = new Array();
            if (selection.eleRef) {
                elements.push(selection);
            }
            else {
                $.each(selection.objects, function(ind, el) {
                    elements.push(el);
                });
            }

            $.each(elements, function(ind, element) {
                var ele = element.eleRef;

                // move neume
                if (ele instanceof Toe.Model.Neume) {
                    // snap to staff
                    var finalCoords = {x: element.left, y: element.top};
                    var sModel = gui.page.getClosestStaff(finalCoords);
                    var snapCoords = sModel.ohSnap(finalCoords, element.currentWidth, {ignoreEle: ele, y: false});

                    // set the bounding box hint for the neume
                    var ulx = snapCoords.x-(element.currentWidth/2);
                    var uly = snapCoords.y-(element.currentHeight/2);
                    var lrx = ulx + element.currentWidth;
                    var lry = uly + element.currentWidth;
                    ele.setBoundingBox([ulx, uly, lrx, lry]);

                    // remove the old neume
                    $(ele).trigger("vEraseDrawing");
                    ele.staff.removeElementByRef(ele);
     
                    // mount the new neume on the most appropriate staff
                    var nInd = sModel.addNeume(ele);
                    if (elements.length == 1) {
                        $(ele).trigger("vSelectDrawing");
                    }

                    // send pitch shift command to server to change underlying MEI
                    var outbb = gui.getOutputBoundingBox([ulx, uly, lrx, lry]);
                    var args = {id: ele.id, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3], pitchInfo: null};

                    // get next element to insert before
                    if (nInd + 1 < sModel.elements.length) {
                        args["beforeid"] = sModel.elements[nInd+1].id;
                    }
                    else {
                        // insert before the next system break (staff)
                        var sNextModel = gui.page.getNextStaff(sModel);
                        args["beforeid"] = sNextModel.id;
                    }

                    $.post(gui.apiprefix + "/move/neume", {data: JSON.stringify(args)})
                    .error(function() {
                        // show alert to user
                        // replace text with error message
                        $("#alert > p").text("Server failed to move neume. Client and server are not synchronized.");
                        $("#alert").animate({opacity: 1.0}, 100);
                    });
                }
            });
            if (elements.length > 1) {
                gui.rendEng.canvas.discardActiveGroup();
            }
            gui.rendEng.repaint();
        }
        // we're all done moving
        gui.objMoving = false;
    });

    // Bind click handlers for the side-bar buttons
    $("#btn_delete").unbind("click");
    $("#btn_neumify").unbind("click");
    $("#btn_ungroup").unbind("click");

    $("#btn_delete").bind("click.edit", {gui: gui}, gui.handleDelete);
    $("#btn_neumify").bind("click.edit", {gui: gui}, gui.handleNeumify);
    $("#btn_neumify_liquescence").bind("click.edit", {gui: gui, modifier: "alt"}, gui.handleNeumify);
    $("#btn_ungroup").bind("click.edit", {gui: gui}, gui.handleUngroup);
}

Toe.View.CheironomicInteraction.prototype.handleDotToggle = function(e) {
    var gui = e.data.gui;
    var punctum = e.data.punctum;

    var hasDot = punctum.components[0].hasOrnament("dot");
    if (!hasDot) {
        // add a dot
        var ornament = new Toe.Model.Ornament("dot", {form: "aug"});
        punctum.components[0].addOrnament(ornament);
    }
    else {
        // remove the dot
        punctum.components[0].removeOrnament("dot");
    }

    // update neume drawing
    punctum.syncDrawing();

    // get final bounding box information
    var outbb = gui.getOutputBoundingBox([punctum.zone.ulx, punctum.zone.uly, punctum.zone.lrx, punctum.zone.lry]);
    var args = {id: punctum.id, dotform: "aug", ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3]};
    if (!hasDot) {
        // send add dot command to server to change underlying MEI
        $.post(gui.apiprefix + "/insert/dot", args)
        .error(function() {
            // show alert to user
            // replace text with error message
            $("#alert > p").text("Server failed to add a dot to the punctum. Client and server are not synchronized.");
            $("#alert").animate({opacity: 1.0}, 100);
        });
    }
    else {
        // send remove dot command to server to change underlying MEI
        $.post(gui.apiprefix + "/delete/dot", args)
        .error(function() {
            // show alert to user
            // replace text with error message
            $("#alert > p").text("Server failed to remove dot from the punctum. Client and server are not synchronized.");
            $("#alert").animate({opacity: 1.0}, 100);
        });
    }

    $(this).toggleClass("active");
}

Toe.View.CheironomicInteraction.prototype.handleDelete = function(e) {
    var gui = e.data.gui;

    // get current canvas selection
    // check individual selection and group selections
    var nids = new Array();

    var deleteNeume = function(drawing) {
        var neume = drawing.eleRef;

        neume.staff.removeElementByRef(neume);
        nids.push(neume.id);

        gui.rendEng.canvas.discardActiveObject();
    };

    var selection = gui.rendEng.canvas.getActiveObject();
    if (selection) {
        if (selection.eleRef instanceof Toe.Model.Neume) {
            deleteNeume(selection);
        }
        gui.rendEng.repaint();
    }
    else {
        selection = gui.rendEng.canvas.getActiveGroup();
        if (selection) {
            // group of elements selected
            $.each(selection.getObjects(), function(oInd, o) {
                if (o.eleRef instanceof Toe.Model.Neume) {
                    deleteNeume(o);
                }
            });

            gui.rendEng.canvas.discardActiveGroup();
            gui.rendEng.repaint();
        }
    }

    if (nids.length > 0) {
        // send delete command to server to change underlying MEI
        $.post(gui.apiprefix + "/delete/neume",  {ids: nids.join(",")})
        .error(function() {
            // show alert to user
            // replace text with error message
            $("#alert > p").text("Server failed to delete neume. Client and server are not synchronized.");
            $("#alert").animate({opacity: 1.0}, 100);
        });
    }
}

/**************************************************
 *                  INSERT                        *
 **************************************************/
Toe.View.CheironomicInteraction.prototype.handleInsert = function(e) {
}

Toe.View.CheironomicInteraction.prototype.getOutputBoundingBox = function(bb) {
    gui = this;
    return $.map(bb, function(b) {
        return Math.round(b/gui.page.scale);
    });
}

Toe.View.CheironomicInteraction.prototype.bindHotKeys = function() {
    var gui = this;

    // delete hotkey
    Mousetrap.bind(['del', 'backspace'], function() {
        $("#btn_delete").trigger('click.edit', {gui:gui}, gui.handleDelete);
        return false;
    });

    Mousetrap.bind(['n', 'Ctrl+n', 'Command+n'], function() {
        $("#btn_neumify").trigger('click.edit', {gui:gui}, gui.handleNeumify);
        return false;
    });

    Mousetrap.bind(['u', 'Ctrl+u', 'Command+u'], function() {
        $("#btn_ungroup").trigger('click.edit', {gui:gui}, gui.handleUngroup);
        return false;
    });
}
