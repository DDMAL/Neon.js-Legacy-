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
 * This class handles interactions, such as neumify, ungroup, head shape changes, deletions, etc., 
 * with the GUI to editing a page of cheironomic (staffless) neumes.
 * 
 * @class Handles interactions with cheironomic (staffless) neumes
 * @param {Toe.View.RenderEngine} rendEng The rendering engine for glyphs on the page
 * @param {Toe.Model.Page} page The model of the page of music being edited
 * @param {String} apiprefix The prefix for each API function call
 * @param {Object} guiToggles Various presets and options for the starting state of the GUI
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
/**
 * Handler that sets up the GUI for editing the page of music by disabling the
 * handlers for insert mode and setting up handlers for edit mode.
 *
 * @methodOf Toe.View.CheironomicInteraction
 * @param {Event} e JavaScript event for the edit button push
 */
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
                              '<ul class="dropdown-menu"><li><a id="btn_neumify_liquescence_aug">liquescence augmented</a></li>\n' +
                              '<li><a id="btn_neumify_liquescence_dim">liquescence diminished</a></li></ul></li>\n' +
                              '<li><button id="btn_ungroup" class="btn"><i class="icon-share"></i> Ungroup</button></li>\n</div>\n</span>');
    }
    
    // grey out edit buttons by default
    $('#btn_delete').toggleClass('disabled', true);
    $('#btn_neumify').toggleClass('disabled', true);
    //$('#btn_neumify_liquescence').toggleClass('disabled', true);
    $('#btn_ungroup').toggleClass('disabled', true);

    // on mouse down get pointer coordinates
    gui.rendEng.canvas.observe('mouse:down', function(e) {
        // cache pointer coordinates for mouse up
        gui.downCoords = gui.rendEng.canvas.getPointer(e.e);
    });

    // set a flag when an object on the canvas is moving
    gui.rendEng.canvas.observe('object:moving', function(e) {
        gui.objMoving = true;
    });

    // when a selection is created, update the appearance of GUI widgets 
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
            //$('#btn_neumify_liquescence').toggleClass('disabled', true);
        }
        else {
            $('#btn_neumify').toggleClass('disabled', false);
            $('#btn_neumify_liquescence_aug').toggleClass('disabled', false);
            $('#btn_neumify_liquescence_dim').toggleClass('disabled', false);
        }

        if (toUngroup > 0) {
            $('#btn_ungroup').toggleClass('disabled', false);
        }
        else {
            $('#btn_ungroup').toggleClass('disabled', true);
        }
    });

    // when a single object is selected, update GUI widgets 
    gui.rendEng.canvas.observe('object:selected', function(e) {
        $('#btn_delete').toggleClass('disabled', false);

        var selection = gui.rendEng.canvas.getActiveObject();
        var ele = selection.eleRef;
        if (ele instanceof Toe.Model.Neume) {
            $("#info > p").html("Selected: " + ele.name);
            $("#info").animate({opacity: 1.0}, 100);

            $('#btn_ungroup').toggleClass('disabled', false);

            $("#menu_editclef").remove();

            if (ele.typeid == "punctum" || ele.typeid == "tractulus" || 
                ele.typeid == "cavum" || ele.typeid == "virga" ||
                ele.typeid == "gravis" || ele.typeid == "oriscus" || ele.typeid == "stropha") {

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
                                              '<li><a id="head_tractulus">tractulus</a></li>\n' +
                                              '<li><a id="head_virga">virga</a></li>\n' +
                                              '<li><a id="head_gravis">gravis</a></li>\n' +
                                              '<li><a id="head_oriscus">oriscus</a></li>\n' +
                                              '<li><a id="head_stropha">stropha</a></li>\n' +
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
                $("#head_tractulus").unbind("click");
                $("#head_virga").unbind("click");
                $("#head_quilisma").unbind("click");
                $("#head_punctum").bind("click.edit", {gui: gui, punctum: ele, shape: "punctum"}, gui.handleHeadShapeChange);
                $("#head_tractulus").bind("click.edit", {gui: gui, punctum: ele, shape: "tractulus"}, gui.handleHeadShapeChange);
                $("#head_virga").bind("click.edit", {gui: gui, punctum: ele, shape: "virga"}, gui.handleHeadShapeChange);
                $("#head_gravis").bind("click.edit", {gui: gui, punctum: ele, shape: "gravis"}, gui.handleHeadShapeChange);
                $("#head_oriscus").bind("click.edit", {gui: gui, punctum: ele, shape: "oriscus"}, gui.handleHeadShapeChange);
                $("#head_stropha").bind("click.edit", {gui: gui, punctum: ele, shape: "stropha"}, gui.handleHeadShapeChange);
                $("#head_quilisma").bind("click.edit", {gui: gui, punctum: ele, shape: "quilisma"}, gui.handleHeadShapeChange);
            }
            else {
                $("#menu_editpunctum").remove();
            }
        }
        else {
            $("#menu_editpunctum").remove();
        }
    });

    // when a set of objects are deselected, update the GUI widgets
    gui.rendEng.canvas.observe('selection:cleared', function(e) {
        // close info alert
        $("#info").animate({opacity: 0.0}, 100);

        // remove selection specific editing options
        $("#menu_editpunctum").remove();

        $('#btn_delete').toggleClass('disabled', true);
        $('#btn_neumify').toggleClass('disabled', true);
        $('#btn_neumify_liquescence_aug').toggleClass('disabled', true);
        $('#btn_neumify_liquescence_dim').toggleClass('disabled', true);
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
    $("#btn_neumify_liquescence_aug").bind("click.edit", {gui: gui, modifier: "aug"}, gui.handleNeumify);
    $("#btn_neumify_liquescence_dim").bind("click.edit", {gui: gui, modifier: "dim"}, gui.handleNeumify);
    $("#btn_ungroup").bind("click.edit", {gui: gui}, gui.handleUngroup);
}

/**
 * Handler for toggling a dot on a single punctum neume.
 *
 * @methodOf Toe.View.CheironomicInteraction
 * @param {Event} e Event of the dot toggle button
 */
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

/**
 * Handler for changing the head shape of a single punctum neume.
 *
 * @methodOf Toe.View.CheironomicInteraction
 * @param {Event} e Event for the head shape change selection box
 */
Toe.View.CheironomicInteraction.prototype.handleHeadShapeChange = function(e) {
    var gui = e.data.gui;
    var shape = e.data.shape;
    var punctum = e.data.punctum;
    var nc = punctum.components[0];

    nc.setHeadShape(shape);

    // deal with head shapes that change the neume name
    switch (shape) {
        case "punctum":
            punctum.name = "Punctum";
            punctum.typeid = "punctum";
            break;
        case "tractulus":
            punctum.name = "Tractulus";
            punctum.typeid = "tractulus";
            break;
        case "virga":
            punctum.name = "Virga";
            punctum.typeid = "virga";
            break;
        case "gravis":
            punctum.name = "Gravis";
            punctum.typeid = "gravis";
            break;
        case "oriscus":
            punctum.name = "Oriscus";
            punctum.typeid = "oriscus";
            break;
        case "stropha":
            punctum.name = "Stropha";
            punctum.typeid = "stropha";
            break;
    }

    // update drawing
    punctum.syncDrawing();

    var outbb = gui.getOutputBoundingBox([punctum.zone.ulx, punctum.zone.uly, punctum.zone.lrx, punctum.zone.lry]);
    var args = {id: punctum.id, shape: shape, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3]};

    // send change head command to server to change underlying MEI
    $.post(gui.apiprefix + "/update/neume/headshape", args)
    .error(function() {
        // show alert to user
        // replace text with error message
        $("#alert > p").text("Server failed to change note head shape. Client and server are not synchronized.");
        $("#alert").animate({opacity: 1.0}, 100);
    });
}

/**
 * Handler for deleting a set of neumes from the page
 *
 * @methodOf Toe.View.CheironomicInteraction
 * @param {Event} e Event for pressing the delete button
 */
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

/**
 * Handler for neumifying a group of selected neumes on the canvas
 *
 * @methodOf Toe.View.CheironomicInteraction
 * @param {Event} e Event for pressing the neumify button
 */
Toe.View.CheironomicInteraction.prototype.handleNeumify = function(e) {
    var gui = e.data.gui;
    var modifier = e.data.modifier;

    // only need to neumify if a group of objects are selected
    var selection = gui.rendEng.canvas.getActiveGroup();
    if (selection) {
        // there is something selected
        // make sure there are at least 2 neumes on the same staff to work with
        var neumes = new Array();
        var sModel = null;
        $.each(selection.getObjects(), function (oInd, o) {
            if (o.eleRef instanceof Toe.Model.Neume) {
                if (!sModel) {
                    sModel = o.eleRef.staff;
                }

                if (o.eleRef.staff == sModel) {
                    neumes.push(o);
                }
            }
        });

        if (neumes.length < 2) {
            return;
        }

        // sort the group based on x position (why fabric doesn't do this, I don't know)
        neumes.sort(function(o1, o2) {
            return o1.eleRef.zone.ulx - o2.eleRef.zone.ulx;
        });

        // begin the NEUMIFICATION
        var newNeume = new Toe.Model.CheironomicNeume({modifier: modifier});
                        
        numPunct = 0;
        var nids = new Array();
        var ulx = Number.MAX_VALUE;
        var uly = Number.MAX_VALUE;
        var lry = Number.MIN_VALUE;

        var prevTop = null;
        $.each(neumes, function (oInd, o) {
            var nModel = o.eleRef;

            // grab underlying notes
            $.merge(newNeume.components, o.eleRef.components);
            
            // update neume ids
            nids.push(o.eleRef.id);

            // calculate object's absolute positions from within selection group
            // use the centre position of each neume to calculate the melodic movement of neume components
            var left = selection.left + o.left;
            var top = selection.top + o.top;
            if (oInd > 0) {
                var relativePitch = 0;
                if (top < prevTop) {
                    relativePitch = 1
                }
                else if (top > prevTop) {
                    relativePitch = -1;
                }
                newNeume.components[numPunct].relativePitch = relativePitch;
            }
            prevTop = top;
            
            ulx = Math.min(ulx, left - o.currentHeight/2);
            uly = Math.min(uly, top - o.currentHeight/2);
            lry = Math.max(lry, top + o.currentHeight/2);

            numPunct += o.eleRef.components.length;

            // remove the neume, we don't need it anymore
            sModel.removeElementByRef(o.eleRef);
            gui.rendEng.canvas.remove(o);

        });
        var lrx = ulx + numPunct*gui.punctWidth;

        // set the bounding box hint of the new neume for drawing
        var bb = [ulx, uly, lrx, lry];
        newNeume.setBoundingBox(bb);

        // instantiate neume view and controller
        var nView = new Toe.View.NeumeView(gui.rendEng, gui.page.documentType);
        var nCtrl = new Toe.Ctrl.NeumeController(newNeume, nView);

        // render the new neume
        sModel.addNeume(newNeume);

        // get final bounding box information
        var outbb = gui.getOutputBoundingBox([newNeume.zone.ulx, newNeume.zone.uly, newNeume.zone.lrx, newNeume.zone.lry]);

        var typeid = newNeume.typeid;

        // get note head shapes to change in underlying mei
        var headShapes = $.map(newNeume.components, function(nc) {
            return nc.props.type;
        });

        var data = JSON.stringify({"nids": nids.join(","), "typeid": typeid, "liquescence": modifier, "headShapes": headShapes, "ulx": outbb[0], "uly": outbb[1], "lrx": outbb[2], "lry": outbb[3]});
        // call server neumify function to update MEI
        $.post(gui.apiprefix + "/neumify", {data: data}, function(data) {
            // set id of the new neume with generated ID from the server
            newNeume.id = JSON.parse(data).id;
        })
        .error(function() {
            // show alert to user
            // replace text with error message
            $("#alert > p").text("Server failed to neumify selected neumes. Client and server are not synchronized.");
            $("#alert").animate({opacity: 1.0}, 100);
        });

        gui.rendEng.canvas.discardActiveGroup();

        // select the new neume
        // TODO: drawing for compound neumes with prefixes from the search tree
        if (newNeume.typeid != "compound") {
            $(newNeume).trigger("vSelectDrawing");
        }

        gui.rendEng.repaint();
    }
}

/**
 * Handler for ungrouping a set of neumes to punctums on the canvas.
 *
 * @methodOf Toe.View.CheironomicInteraction
 * @param {Event} e Event for pressing the ungroup button
 */
Toe.View.CheironomicInteraction.prototype.handleUngroup = function(e) {
    var gui = e.data.gui;

    var neumes = new Array();

    var selection = gui.rendEng.canvas.getActiveObject();
    if (selection) {
        if (selection.eleRef instanceof Toe.Model.Neume && selection.eleRef.components.length > 1) {
            neumes.push(selection);
        }
    }
    else {
        selection = gui.rendEng.canvas.getActiveGroup();
        if (selection) {
            // group of elements selected
            $.each(selection.getObjects(), function(oInd, o) {
                // only deal with neumes with that have more components than a punctum
                if (o.eleRef instanceof Toe.Model.Neume && o.eleRef.components.length > 1) {
                    neumes.push(o);
                }
            });
        }
    }

    var nids = new Array();
    var bbs = new Array();
    var punctums = new Array();

    // ungroup each selected neume
    $.each(neumes, function(oInd, o) {
        // add to list of neume ids
        nids.push(o.eleRef.id);

        var punctBoxes = new Array();
        var ulx = o.eleRef.zone.ulx;

        // remove the old neume
        o.eleRef.staff.removeElementByRef(o.eleRef);
        gui.rendEng.canvas.remove(o);

        $.each(o.eleRef.components, function(ncInd, nc) {
            var newPunct = new Toe.Model.CheironomicNeume();
            newPunct.addComponent(nc);

            var uly = o.eleRef.zone.uly;
            if (o.eleRef.components[ncInd].relativePitch) {
                uly += (-o.eleRef.components[ncInd].relativePitch * gui.punctHeight);
            }

            // set the bounding box hint of the new neume for drawing
            var bb = [ulx+(ncInd*gui.punctWidth), uly, ulx+((ncInd+1)*gui.punctWidth), uly+gui.punctHeight];
            newPunct.setBoundingBox(bb);

            // instantiate neume view and controller
            var nView = new Toe.View.NeumeView(gui.rendEng, gui.page.documentType);
            var nCtrl = new Toe.Ctrl.NeumeController(newPunct, nView);

            // add the punctum to the staff and draw it
            o.eleRef.staff.addNeume(newPunct);

            // get final bounding box information
            var outbb = gui.getOutputBoundingBox([newPunct.zone.ulx, newPunct.zone.uly, newPunct.zone.lrx, newPunct.zone.lry]);
            punctBoxes.push({"ulx": outbb[0], "uly": outbb[1], "lrx": outbb[2], "lry": outbb[3]});

            punctums.push(newPunct);
        });

        // add to list of neume bounding boxes
        bbs.push(punctBoxes);
    });

    var data = JSON.stringify({"nids": nids.join(","), "bbs": bbs});

    // call server ungroup function to update MEI
    $.post(gui.apiprefix + "/ungroup", {data: data}, function(data) {
        // set ids of the new puncta from the IDs generated from the server
        var nids = JSON.parse(data).nids;
        // flatten array of nested nid arrays (if ungrouping more than one neume)
        nids = $.map(nids, function(n) {
            return n;
        });

        $.each(punctums, function(i, punct) {
            punct.id = nids[i];
        });
    })
    .error(function() {
        // show alert to user
        // replace text with error message
        $("#alert > p").text("Server failed to ungroup selected neumes. Client and server are not synchronized.");
        $("#alert").animate({opacity: 1.0}, 100);
    });

    gui.rendEng.canvas.discardActiveObject();
    gui.rendEng.canvas.discardActiveGroup();
    gui.rendEng.repaint();
}

/**************************************************
 *                  INSERT                        *
 **************************************************/
/**
 * Handler for inserting a punctum neume on the canvas, which removes edit GUI widgets
 * and adds insert GUI widgets.
 *
 * @methodOf Toe.View.CheironomicInteraction
 * @param {Event} e Event from pressing the insert button
 */
Toe.View.CheironomicInteraction.prototype.handleInsert = function(e) {
    var gui = e.data.gui;
    var parentDivId = e.data.parentDivId;

    // deactivate all objects on the canvas 
    // so they can't be modified in insert mode
    gui.rendEng.canvas.selection = false;
    gui.rendEng.canvas.deactivateAll();
    gui.rendEng.canvas.HOVER_CURSOR = null;

    // first remove edit options
    $("#sidebar-edit").remove();

    // unbind edit event handlers
    $("#btn_delete").unbind("click.edit");
    $("#btn_neumify").unbind("click.edit");
    $("#btn_ungroup").unbind("click.edit");

    // unbind move event handlers
    gui.rendEng.unObserve("mouse:down");
    gui.rendEng.unObserve("mouse:up");
    gui.rendEng.unObserve("object:moving");
    gui.rendEng.unObserve("object:selected");
    gui.rendEng.unObserve("selection:cleared");
    gui.rendEng.unObserve("selection:created");

    // then add insert options
    if ($("#sidebar-insert").length == 0) {
        $(parentDivId).append('<span id="sidebar-insert"><br/><li class="divider"></li><li class="nav-header">Insert</li>\n' +
                              '<li><div class="btn-group" data-toggle="buttons-radio">' +
                              '<button id="rad_punctum" class="btn"><i class="icon-bookmark icon-black"></i> Punctum</button>\n' +
                              '\n</div>\n</li>\n</span>');
    }

    // update click handlers
    $("#rad_punctum").unbind("click");
    $("#rad_punctum").bind("click.insert", {gui: gui}, gui.handleInsertPunctum);

    // toggle punctum insert by default
    $("#rad_punctum").trigger('click');
}

/**
 * Handler for inserting a punctum neume on the canvas.
 *
 * @methodOf Toe.View.CheironomicInteraction
 * @param {Event} e Event for clicking on the canvas to insert a punctum
 */
Toe.View.CheironomicInteraction.prototype.handleInsertPunctum = function(e) {
    var gui = e.data.gui;

    // unbind other event handlers
    gui.rendEng.unObserve("mouse:move");
    gui.rendEng.unObserve("mouse:up");

    // add ornamentation toggles
    if ($("#menu_insertpunctum").length == 0) {
        $("#sidebar-insert").append('<span id="menu_insertpunctum"><br/><li class="nav-header">Ornamentation</li>\n' +
                                    '<li><div class="btn-group" data-toggle="buttons-checkbox">\n' +
                                    '<button id="chk_dot" class="btn">&#149; Dot</button>\n' +
                                    '<button id="chk_horizepisema" class="btn"><i class="icon-resize-horizontal"></i> Episema</button>\n' +
                                    '<button id="chk_vertepisema" class="btn"><i class="icon-resize-vertical"></i> Episema</button>\n</div></li></span>');
    }

    // ornamentation toggle flags
    var hasDot = false;
    var hasHorizEpisema = false;
    var hasVertEpisema = false;

    // keep the scope of the punctum drawing insert local
    // to not pollute the global namespace when inserting other
    // musical elements
    var updateFollowPunct = function(initial) {
        var elements = {modify: new Array(), fixed: new Array()};

        var punctPos = null;
        var punctGlyph = gui.rendEng.getGlyph("punctum");
        if (initial) {
            // draw the punctum off the screen, initially
            var punctPos = {left: -50, top: -50};
        }
        else {
            var punctPos = {left: gui.punctDwg.left, top: gui.punctDwg.top};

            if (hasDot) {
                var glyphDot = gui.rendEng.getGlyph("dot");
                var dot = glyphDot.clone().set({left: punctPos.left + gui.punctWidth, top: punctPos.top + (gui.punctHeight/2), opacity: 0.6});
                elements.modify.push(dot);
            }

            /* TODO: deal with episemata
            if (hasHorizEpisema) {
            }

            if (hasVertEpisema) {
            }
            */
        }

        // create clean punctum glyph with no ornamentation
        var punct = punctGlyph.clone().set({left: punctPos.left, top: punctPos.top, opacity: 0.6});
        elements.modify.push(punct);

        // remove old punctum drawing following the pointer
        if (gui.punctDwg) {
            gui.rendEng.canvas.remove(gui.punctDwg);
        }

        // replace with new punctum drawing
        gui.punctDwg = gui.rendEng.draw(elements, {group: true, selectable: false, repaint: true})[0]; 
    };

    // put the punctum off the screen for now
    updateFollowPunct(true);

    // render transparent punctum at pointer location
    gui.rendEng.canvas.observe('mouse:move', function(e) {
        var pnt = gui.rendEng.canvas.getPointer(e.e);
        gui.punctDwg.left = pnt.x - gui.punctDwg.currentWidth/4;
        gui.punctDwg.top = pnt.y - gui.punctDwg.currentHeight/4;

        gui.rendEng.repaint();
    });

    // deal with punctum insert
    gui.rendEng.canvas.observe('mouse:up', function(e) {
        var coords = {x: gui.punctDwg.left, y: gui.punctDwg.top};
        var sModel = gui.page.getClosestStaff(coords);

        // instantiate a punctum
        var nModel = new Toe.Model.CheironomicNeume();

        // calculate snapped coords
        var snapCoords = sModel.ohSnap(coords, gui.punctDwg.currentWidth, {y: false});

        // update bounding box with physical position on the page
        var ulx = snapCoords.x - gui.punctDwg.currentWidth/2;
        var uly = snapCoords.y - gui.punctDwg.currentHeight/2;
        var bb = [ulx, uly, ulx + gui.punctDwg.currentWidth, uly + gui.punctDwg.currentHeight];
        nModel.setBoundingBox(bb);

        //  start forming arguments for the server function call
        var args = {};

        // check ornamentation toggles to add to component
        var ornaments = new Array();
        if (hasDot) {
            ornaments.push(new Toe.Model.Ornament("dot", {form: "aug"}));
            args["dotform"] = "aug";
        }
        
        /* TODO: deal with episemata
        if (hasHorizEpisema) {
        }
        if (hasVertEpisema) {
        }
        */

        var nc = new Toe.Model.CheironomicNeumeComponent({type: "punctum", ornaments: ornaments});
        nModel.addComponent(nc);

        // TODO: remove manually specifying neume type in lieu of trie search
        nModel.typeid = nModel.name = "punctum";

        // instantiate neume view and controller
        var nView = new Toe.View.NeumeView(gui.rendEng, gui.page.documentType);
        var nCtrl = new Toe.Ctrl.NeumeController(nModel, nView);
        
        // mount neume on the staff
        var nInd = sModel.addNeume(nModel);

        // now that final bounding box is calculated from the drawing
        // add the bounding box information to the server function arguments
        var outbb = gui.getOutputBoundingBox([nModel.zone.ulx, nModel.zone.uly, nModel.zone.lrx, nModel.zone.lry]);
        args["ulx"] = outbb[0];
        args["uly"] = outbb[1];
        args["lrx"] = outbb[2];
        args["lry"] = outbb[3];

        // get next element to insert before
        if (nInd + 1 < sModel.elements.length) {
            args["beforeid"] = sModel.elements[nInd+1].id;
        }
        else {
            // insert before the next system break (staff)
            var sNextModel = gui.page.getNextStaff(sModel);
            if (sNextModel) {
                args["beforeid"] = sNextModel.id;
            }
        }

        // send insert command to server to change underlying MEI
        $.post(gui.apiprefix + "/insert/neume", args, function(data) {
            nModel.id = JSON.parse(data).id;
        })
        .error(function() {
            // show alert to user
            // replace text with error message
            $("#alert > p").text("Server failed to insert neume. Client and server are not synchronized.");
            $("#alert").animate({opacity: 1.0}, 100);
        });
    });

    $("#chk_dot").bind("click.insert", function() {
        // toggle dot
        if (!hasDot) {
            hasDot = true;
        }
        else {
            hasDot = false;
        }

        updateFollowPunct(false);
    });

    /* TODO: insert with episemata
    $("#chk_horizepisema").bind("click.insert", function() {
        if ($(this).hasClass("active")) {
            hasHorizEpisema = true;
        }
        else {
            hasHorizEpisema = false;
        }
    });

    $("#chk_vertepisema").bind("click.insert", function() {
    });
    */
}

/**
 * Helper function to translate the coordinates of the bounding box to incorporate
 * the scale of the page to fit on the fixed canvas size.
 *
 * @methodOf Toe.View.CheironomicInteraction
 * @param {Array} bb Array of bounding box coordinates [ulx, uly, lrx, lry]
 */
Toe.View.CheironomicInteraction.prototype.getOutputBoundingBox = function(bb) {
    gui = this;
    return $.map(bb, function(b) {
        return Math.round(b/gui.page.scale);
    });
}

/**
 * Helper function to set up hotkeys for interacting with the GUI widgets
 * as an alternative to clicking buttons with the mouse.
 *
 * @methodOf Toe.View.CheironomicInteraction
 */
Toe.View.CheironomicInteraction.prototype.bindHotKeys = function() {
    var gui = this;

    // delete hotkey
    Mousetrap.bind(['del', 'backspace'], function() {
        $("#btn_delete").trigger('click.edit', {gui:gui}, gui.handleDelete);
        return false;
    });

    // neumify hotkey
    Mousetrap.bind(['n', 'Ctrl+n', 'Command+n'], function() {
        $("#btn_neumify").trigger('click.edit', {gui:gui}, gui.handleNeumify);
        return false;
    });

    // ungroup hotkey
    Mousetrap.bind(['u', 'Ctrl+u', 'Command+u'], function() {
        $("#btn_ungroup").trigger('click.edit', {gui:gui}, gui.handleUngroup);
        return false;
    });
}
