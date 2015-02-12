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

Toe.View.SquareNoteInteraction = function(rendEng, page, apiprefix, guiToggles) {
    Toe.View.Interaction.call(this, rendEng, page, apiprefix, guiToggles);
    var toggles = {
        initMode: "edit"
    };

    $.extend(toggles, guiToggles);

    // these are variables holding pointers to the drawings
    // that follow around the pointer in insert mode.
    this.punctDwg = null;
    this.divisionDwg = null;
    this.clefDwg = null;
    this.systemDwg = null;

    // cache height and width of punctum glyph for use in
    // bounding box estimation in neumify and ungroup
    // and insert ornamentation spacing.
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

    // bind hotkeys
    this.bindHotKeys();
};

Toe.View.SquareNoteInteraction.prototype = new Toe.View.Interaction();
Toe.View.SquareNoteInteraction.prototype.constructor = Toe.View.SquareNoteInteraction;

/**************************************************
 *                  EDIT                          *
 **************************************************/
Toe.View.SquareNoteInteraction.prototype.handleEdit = function(e) {
    
    var gui = e.data.gui;
    gui.hideInfo();
    gui.activateCanvasObjects();
    gui.removeInsertControls();
    gui.removeInsertSubControls();
    gui.unbindEventHandlers();
    gui.insertEditControls(e.data.parentDivId);
    gui.removeEditSubControls();

    // Listen for object events.
    gui.rendEng.canvas.observe('object:modified', function(aObject) {gui.handleEventObjectModified(aObject);});
    gui.rendEng.canvas.observe('object:moving', function(e) {gui.objMoving = true;});
    gui.rendEng.canvas.observe('object:selected', function(aObject) {gui.handleEventObjectSelected(aObject);});

    // Listen for selection events.
    gui.rendEng.canvas.observe('selection:cleared', function(aObject) { gui.handleEventSelectionCleared(aObject);});
    gui.rendEng.canvas.observe('selection:created', function(aObject) { gui.handleEventSelectionCreated(aObject);});

    // Listen for mouse events.
    gui.rendEng.canvas.observe('mouse:down', function(e) {gui.downCoords = gui.rendEng.canvas.getPointer(e.e);});
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

                if (ele instanceof Toe.Model.Clef) {
                    // this is a clef
                    var left = element.left;
                    var top = element.top;
                    if (elements.length > 1) {
                        // calculate object's absolute positions from within selection group
                        left = selection.left + element.left;
                        top = selection.top + element.top;
                    }

                    // snap release position to line/space
                    var snappedCoords = ele.system.getSystemSnapCoordinates({x: left, y: top}, null, {ignoreEle: ele});

                    // TODO clefs moving to different systems?

                    // get system position of snapped coordinates
                    var systemPos = -Math.round((snappedCoords.y - ele.system.zone.uly) / (ele.system.delta_y/2));

                    ele.setSystemPosition(systemPos);

                    var neumesOnSystem = ele.system.getPitchedElements({neumes: true, custos: false});
                    if (neumesOnSystem.length > 0 && ele.system.getActingClefByEle(neumesOnSystem[0]) == ele) {
                        // if the shift of the clef has affected the first neume on this system
                        // update the custos on the previous system
                        var prevSystem = gui.page.getPreviousSystem(ele.system);
                        if (prevSystem) {
                            var newPname = neumesOnSystem[0].components[0].pname;
                            var newOct = neumesOnSystem[0].components[0].oct;
                            gui.handleUpdatePrevCustos(newPname, newOct, prevSystem);
                        }
                    }

                    // gather new pitch information of affected pitched elements
                    var pitchInfo = $.map(ele.system.getPitchedElements({clef: ele}), function(e) {
                        if (e instanceof Toe.Model.Neume) {
                            var pitchInfo = new Array();
                            $.each(e.components, function(nInd, n) {
                                pitchInfo.push({pname: n.pname, oct: n.oct});
                            });
                            return {id: e.id, noteInfo: pitchInfo};
                        }
                        else if (e instanceof Toe.Model.Custos) {
                            // the custos has been vertically moved
                            // update the custos bounding box information in the model
                            // do not need to update pitch name & octave since this does not change
                            var outbb = gui.getOutputBoundingBox([e.zone.ulx, e.zone.uly, e.zone.lrx, e.zone.lry]);
                            $.post(gui.apiprefix + "/move/custos", {id: e.id, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3]})
                            .error(function() {
                                this.showAlert("Server failed to move custos. Client and server are not synchronized.");
                            });
                        }
                    });

                    // convert systemPos to staffLine format used in MEI attribute
                    var systemLine = ele.system.props.numLines + (ele.props.systemPos/2);
                    var outbb = gui.getOutputBoundingBox([ele.zone.ulx, ele.zone.uly, ele.zone.lrx, ele.zone.lry]);
                    var args = {id: ele.id, line: systemLine, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3], pitchInfo: pitchInfo};

                    // send pitch shift command to server to change underlying MEI
                    $.post(gui.apiprefix + "/move/clef", {data: JSON.stringify(args)})
                    .error(function() {
                        this.showAlert("Server failed to move clef. Client and server are not synchronized.");
                    });
                }
                else if (ele instanceof Toe.Model.Neume) {
                    // we have a neume, this is a pitch shift
                    var left = element.left;
                    var top = element.top;
                    if (elements.length > 1) {
                        // calculate object's absolute positions from within selection group
                        left = selection.left + element.left;
                        top = selection.top + element.top;
                    }

                    // get y position of first neume component
                    var nc_y = ele.system.zone.uly - ele.rootSystemPos*ele.system.delta_y/2;
                    var finalCoords = {x: left, y: nc_y - delta_y};

                    var sModel = gui.page.getClosestSystem(finalCoords);
                    
                    // snap to system
                    var snapCoords = sModel.getSystemSnapCoordinates(finalCoords, element.currentWidth, {ignoreEle: ele});

                    var newRootSystemPos = Math.round((sModel.zone.uly - snapCoords.y) / (sModel.delta_y/2));

                    // construct bounding box hint for the new drawing: bounding box changes when dot is repositioned
                    var ulx = snapCoords.x-(element.currentWidth/2);
                    var uly = top-(element.currentHeight/2)-(finalCoords.y-snapCoords.y);
                    var bb = [ulx, uly, ulx + element.currentWidth, uly + element.currentHeight];
                    ele.setBoundingBox(bb);

                    var oldRootSystemPos = ele.rootSystemPos;
                    // derive pitch name and octave of notes in the neume on the appropriate system
                    $.each(ele.components, function(ncInd, nc) {
                        var noteInfo = sModel.calcPitchFromCoords({x: snapCoords.x, y: snapCoords.y - (sModel.delta_y/2 * nc.pitchDiff)});
                        nc.setPitchInfo(noteInfo["pname"], noteInfo["oct"]);
                    });

                    // remove the old neume
                    $(ele).trigger("vEraseDrawing");
                    ele.system.removeElementByRef(ele);
     
                    // mount the new neume on the most appropriate system
                    var nInd = sModel.addNeume(ele);
                    if (elements.length == 1) {
                        $(ele).trigger("vSelectDrawing");
                    }

                    var outbb = gui.getOutputBoundingBox([ele.zone.ulx, ele.zone.uly, ele.zone.lrx, ele.zone.lry]);
                    var args = {id: ele.id, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3]};
                    if (oldRootSystemPos != newRootSystemPos) {
                        // this is a pitch shift
                        args.pitchInfo = new Array();
                        $.each(ele.components, function(ncInd, nc) {
                            args.pitchInfo.push({"pname": nc.pname, "oct": nc.oct});
                        });

                        // if this element is the first neume on the system
                        if (ele == sModel.elements[1]) {
                            var prevSystem = gui.page.getPreviousSystem(sModel);
                            if (prevSystem) {
                                var cPname = ele.components[0].pname;
                                var cOct = ele.components[0].oct;
                                gui.handleUpdatePrevCustos(cPname, cOct, prevSystem);
                            }
                        }
                    }
                    else {
                        args.pitchInfo = null
                    }

                    // get next element to insert before
                    if (nInd + 1 < sModel.elements.length) {
                        args["beforeid"] = sModel.elements[nInd+1].id;
                    }
                    else {
                        // insert before the next system break (system)
                        var sNextModel = gui.page.getNextSystem(sModel);
                        args["beforeid"] = sNextModel.id;
                    }

                    // send pitch shift command to server to change underlying MEI
                    $.post(gui.apiprefix + "/move/neume", {data: JSON.stringify(args)})
                    .error(function() {
                        this.showAlert("Server failed to move neume. Client and server are not synchronized.");
                    });
                }
                else if (ele instanceof Toe.Model.Division) {
                    // this is a division
                    var left = element.left;
                    var top = element.top;
                    if (elements.length > 1) {
                        // calculate object's absolute positions from within selection group
                        left += selection.left;
                        top += selection.top;
                    }

                    var finalCoords = {x: left, y: top};
                    
                    // get closest system
                    var system = gui.page.getClosestSystem(finalCoords);

                    var snapCoords = system.getSystemSnapCoordinates(finalCoords, element.currentWidth, {x: true, y: false});

                    // get vertical snap coordinates for the appropriate system
                    switch (ele.type) {
                        case Toe.Model.Division.Type.div_small:
                            snapCoords.y = system.zone.uly;
                            break;
                        case Toe.Model.Division.Type.div_minor:
                            snapCoords.y = system.zone.uly + (system.zone.lry - system.zone.uly)/2;
                            break;
                        case Toe.Model.Division.Type.div_major:
                            snapCoords.y = system.zone.uly + (system.zone.lry - system.zone.uly)/2;
                            break;
                        case Toe.Model.Division.Type.div_final:
                            snapCoords.y = system.zone.uly + (system.zone.lry - system.zone.uly)/2;
                            break;
                    }

                    // remove division from the previous system representation
                    ele.system.removeElementByRef(ele);
                    gui.rendEng.canvas.remove(element);
                    gui.rendEng.repaint();

                    // set bounding box hint 
                    var ulx = snapCoords.x - element.currentWidth/2;
                    var uly = snapCoords.y - element.currentHeight/2;
                    var bb = [ulx, uly, ulx + element.currentWidth, uly + element.currentHeight];
                    ele.setBoundingBox(bb);

                    // get id of note to move before
                    var dInd = system.addDivision(ele);
                    if (elements.length == 1) {
                        ele.selectDrawing();
                    }

                    var beforeid = null;
                    if (dInd + 1 < system.elements.length) {
                        beforeid = system.elements[dInd+1].id;
                    }
                    else {
                        // insert before the next system break
                        var sNextModel = gui.page.getNextSystem(system);
                        beforeid = sNextModel.id;
                    }

                    var outbb = gui.getOutputBoundingBox([ele.zone.ulx, ele.zone.uly, ele.zone.lrx, ele.zone.lry]);
                    var data = {id: ele.id, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3], beforeid: beforeid};

                    // send move command to the server to change underlying MEI
                    $.post(gui.apiprefix + "/move/division", data)
                    .error(function() {
                        this.showAlert("Server failed to move division. Client and server are not synchronized.");
                    });
                }
                else if (ele instanceof Toe.Model.Custos) {
                    var left = element.left;
                    var top = element.top;

                    // only need to reset position if part of a selection with multiple elements
                    // since single selection move disabling is handled by the lockMovementX/Y parameters.
                    if (elements.length > 1) {
                        // return the custos to the original position
                        element.left = left + delta_x;
                        element.top = top + delta_y;
                    }
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
};

Toe.View.SquareNoteInteraction.prototype.handleDotToggle = function(e) {
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
            this.showAlert("Server failed to add a dot to the punctum. Client and server are not synchronized.");
        });
    }
    else {
        // send remove dot command to server to change underlying MEI
        $.post(gui.apiprefix + "/delete/dot", args)
        .error(function() {
            this.showAlert("Server failed to remove dot from the punctum. Client and server are not synchronized.");
        });
    }

    $(this).toggleClass("active");
}

Toe.View.SquareNoteInteraction.prototype.handleHeadShapeChange = function(e) {
    var gui = e.data.gui;
    var shape = e.data.shape;
    var punctum = e.data.punctum;
    var nc = punctum.components[0];

    nc.setHeadShape(shape);

    // deal with head shapes that change the neume name
    if (shape == "virga") {
        punctum.name = "Virga";
        punctum.typeid = "virga";
    }
    else if (shape == "cavum") {
        punctum.name = "Cavum";
        punctum.typeid = "cavum";
    }

    // update drawing
    punctum.syncDrawing();

    var outbb = gui.getOutputBoundingBox([punctum.zone.ulx, punctum.zone.uly, punctum.zone.lrx, punctum.zone.lry]);
    var args = {id: punctum.id, shape: shape, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3]};

    // send change head command to server to change underlying MEI
    $.post(gui.apiprefix + "/update/neume/headshape", args)
    .error(function() {
        this.showAlert("Server failed to change note head shape. Client and server are not synchronized.");
    });
}

Toe.View.SquareNoteInteraction.prototype.handleClefShapeChange = function(e) {
    var gui = e.data.gui;
    var clef = e.data.clef;
    var cShape = e.data.shape;

    if (clef.shape != cShape) {
        clef.setShape(cShape);

        var neumesOnSystem = clef.system.getPitchedElements({neumes: true, custos: false});
        if (neumesOnSystem.length > 0 && clef.system.getActingClefByEle(neumesOnSystem[0]) == clef) {
            // if the shift of the clef has affected the first neume on this system
            // update the custos on the previous system
            var prevSystem = gui.page.getPreviousSystem(clef.system);
            if (prevSystem) {
                var newPname = neumesOnSystem[0].components[0].pname;
                var newOct = neumesOnSystem[0].components[0].oct;
                gui.handleUpdatePrevCustos(newPname, newOct, prevSystem);
            }
        }

        var pitchInfo = $.map(clef.system.getPitchedElements({clef: clef}), function(e) {
            if (e instanceof Toe.Model.Neume) {
                var pitchInfo = new Array();
                $.each(e.components, function(nInd, n) {
                    pitchInfo.push({pname: n.pname, oct: n.oct});
                });
                return {id: e.id, noteInfo: pitchInfo};
            }
            else if (e instanceof Toe.Model.Custos) {
                // the custos has been vertically moved
                // update the custos bounding box information in the model
                // do not need to update pitch name & octave since this does not change
                var outbb = gui.getOutputBoundingBox([e.zone.ulx, e.zone.uly, e.zone.lrx, e.zone.lry]);
                $.post(gui.apiprefix + "/move/custos", {id: e.id, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3]})
                .error(function() {
                    this.showAlert("Server failed to move custos. Client and server are not synchronized.");
                });
            }
        });

        var outbb = gui.getOutputBoundingBox([clef.zone.ulx, clef.zone.uly, clef.zone.lrx, clef.zone.lry]);
        var args = {id: clef.id, shape: cShape, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3], pitchInfo: pitchInfo};

        // send pitch shift command to server to change underlying MEI
        $.post(gui.apiprefix + "/update/clef/shape", {data: JSON.stringify(args)})
        .error(function() {
            this.showAlert("Server failed to update clef shape. Client and server are not synchronized.");
        });

        $(this).toggleClass("active");
    }
};

Toe.View.SquareNoteInteraction.prototype.handleNeumify = function(e) {
    var gui = e.data.gui;
    var modifier = e.data.modifier;

    // only need to neumify if a group of objects are selected
    var selection = gui.rendEng.canvas.getActiveGroup();
    if (selection) {
        // there is something selected
        // make sure there are at least 2 neumes on the same system to work with
        var neumes = new Array();
        var sModel = null;
        $.each(selection.getObjects(), function (oInd, o) {
            if (o.eleRef instanceof Toe.Model.Neume) {
                if (!sModel) {
                    sModel = o.eleRef.system;
                }

                if (o.eleRef.system == sModel) {
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
        var newNeume = new Toe.Model.SquareNoteNeume({modifier: modifier});
                        
        numPunct = 0;
        var nids = new Array();
        var ulx = Number.MAX_VALUE;
        var uly = Number.MAX_VALUE;
        var lry = Number.MIN_VALUE;
        $.each(neumes, function (oInd, o) {
            var nModel = o.eleRef;

            // grab underlying notes
            $.merge(newNeume.components, o.eleRef.components);
            numPunct += o.eleRef.components.length;

            // update neume ids
            nids.push(o.eleRef.id);

            // calculate object's absolute positions from within selection group
            var left = selection.left + o.left;
            var top = selection.top + o.top;
            
            ulx = Math.min(ulx, left - o.currentHeight/2);
            uly = Math.min(uly, top - o.currentHeight/2);
            lry = Math.max(lry, top + o.currentHeight/2);

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

        var data = JSON.stringify({"nids": nids.join(","), "typeid": typeid, "headShapes": headShapes, "ulx": outbb[0], "uly": outbb[1], "lrx": outbb[2], "lry": outbb[3]});
        // call server neumify function to update MEI
        $.post(gui.apiprefix + "/neumify", {data: data}, function(data) {
            // set id of the new neume with generated ID from the server
            newNeume.id = JSON.parse(data).id;
        })
        .error(function() {
            this.showAlert("Server failed to neumify selected neumes. Client and server are not synchronized.");
        });

        gui.rendEng.canvas.discardActiveGroup();

        // select the new neume
        $(newNeume).trigger("vSelectDrawing");

        gui.rendEng.repaint();
    }
}

Toe.View.SquareNoteInteraction.prototype.handleUngroup = function(e) {
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
        o.eleRef.system.removeElementByRef(o.eleRef);
        gui.rendEng.canvas.remove(o);

        $.each(o.eleRef.components, function(ncInd, nc) {
            var newPunct = new Toe.Model.SquareNoteNeume();
            newPunct.components.push(nc);

            var uly = o.eleRef.system.zone.uly - (o.eleRef.rootSystemPos + nc.pitchDiff)*o.eleRef.system.delta_y/2 - gui.punctHeight/2;
            // set the bounding box hint of the new neume for drawing
            var bb = [ulx+(ncInd*gui.punctWidth), uly, ulx+((ncInd+1)*gui.punctWidth), uly+gui.punctHeight];
            newPunct.setBoundingBox(bb);

            // instantiate neume view and controller
            var nView = new Toe.View.NeumeView(gui.rendEng, gui.page.documentType);
            var nCtrl = new Toe.Ctrl.NeumeController(newPunct, nView);

            // add the punctum to the system and draw it
            o.eleRef.system.addNeume(newPunct);

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
        this.showAlert("Server failed to ungroup selected neumes. Client and server are not synchronized.");
    });

    gui.rendEng.canvas.discardActiveObject();
    gui.rendEng.canvas.discardActiveGroup();
    gui.rendEng.repaint();
}

/**************************************************
 *                  INSERT                        *
 **************************************************/
Toe.View.SquareNoteInteraction.prototype.handleInsert = function(e) {
    var gui = e.data.gui;
    var parentDivId = e.data.parentDivId;
    gui.hideInfo();
    gui.deactivateCanvasObjects();
    gui.removeInsertControls();
    gui.unbindInsertControls();
    gui.removeEditControls();
    gui.unbindEditControls();
    gui.unbindEditSubControls();
    gui.unbindEventHandlers();
    gui.insertInsertControls(parentDivId);
}

Toe.View.SquareNoteInteraction.prototype.handleInsertPunctum = function(e) {
    var gui = e.data.gui;
    gui.unbindEventHandlers();
    gui.removeInsertSubControls();

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
                var dot = glyphDot.clone().set({left: punctPos.left + gui.punctWidth, top: punctPos.top, opacity: 0.6});
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
        var sModel = gui.page.getClosestSystem(coords);

        // instantiate a punctum
        var nModel = new Toe.Model.SquareNoteNeume();

        // calculate snapped coords
        var snapCoords = sModel.getSystemSnapCoordinates(coords, gui.punctDwg.currentWidth);

        // update bounding box with physical position on the page
        var ulx = snapCoords.x - gui.punctDwg.currentWidth/2;
        var uly = snapCoords.y - gui.punctDwg.currentHeight/2;
        var bb = [ulx, uly, ulx + gui.punctDwg.currentWidth, uly + gui.punctDwg.currentHeight];
        nModel.setBoundingBox(bb);

        // get pitch name and octave of snapped coords of note
        var noteInfo = sModel.calcPitchFromCoords(snapCoords);
        var pname = noteInfo["pname"];
        var oct = noteInfo["oct"];

        //  start forming arguments for the server function call
        var args = {pname: pname, oct: oct};

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

        var nc = new Toe.Model.SquareNoteNeumeComponent(pname, oct, {type: "punctum", ornaments: ornaments});
        nModel.addComponent(nc);

        // instantiate neume view and controller
        var nView = new Toe.View.NeumeView(gui.rendEng, gui.page.documentType);
        var nCtrl = new Toe.Ctrl.NeumeController(nModel, nView);
        
        // mount neume on the system
        var nInd = sModel.addNeume(nModel);

        // if this is the first neume on a system, update the custos of the next system
        if (nInd == 1) {
            var prevSystem = gui.page.getPreviousSystem(sModel);
            if (prevSystem) {
                gui.handleUpdatePrevCustos(pname, oct, prevSystem);
            }
        }

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
            // insert before the next system break (system)
            var sNextModel = gui.page.getNextSystem(sModel);
            if (sNextModel) {
                args["beforeid"] = sNextModel.id;
            }
        }

        // send insert command to server to change underlying MEI
        $.post(gui.apiprefix + "/insert/neume", args, function(data) {
            nModel.id = JSON.parse(data).id;
        })
        .error(function() {
            this.showAlert("Server failed to insert neume. Client and server are not synchronized.");
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

Toe.View.SquareNoteInteraction.prototype.handleInsertDivision = function(e) {
    var gui = e.data.gui;
    gui.unbindEventHandlers();
    gui.removeInsertSubControls();

    // add division type toggles
    if ($("#menu_insertdivision").length == 0) {
        $("#sidebar-insert").append('<span id="menu_insertdivision"><br/>\n<li class="nav-header">Division Type</li>\n' +
                                    '<li><div class="btn-group" data-toggle="buttons-radio">\n' +
                                    '<button id="rad_small" class="btn">Small</button>\n' +
                                    '<button id="rad_minor" class="btn">Minor</button>\n' +
                                    '<button id="rad_major" class="btn">Major</button>\n' +
                                    '<button id="rad_final" class="btn">Final</button>\n</div>\n</li>\n</span>');
    }

    var divisionForm = null;
    var system = null;

    gui.rendEng.canvas.observe('mouse:move', function(e) {
        var pnt = gui.rendEng.canvas.getPointer(e.e);

        // get closest system
        system = gui.page.getClosestSystem(pnt);

        var snapCoords = pnt;
        var divProps = {strokeWidth: 4, opacity: 0.6};
        switch (divisionForm) {
            case "div_small":
                snapCoords.y = system.zone.uly;

                if (!gui.divisionDwg) {
                    var y1 = system.zone.uly - system.delta_y/2;
                    var y2 = system.zone.uly + system.delta_y/2;
                    var x1 = snapCoords.x;

                    gui.divisionDwg = gui.rendEng.createLine([x1, y1, x1, y2], divProps);
                    gui.rendEng.draw({fixed: [gui.divisionDwg], modify: []}, {selectable: false, opacity: 0.6});
                }
                break;
            case "div_minor":
                snapCoords.y = system.zone.uly + (system.zone.lry - system.zone.uly)/2;

                if (!gui.divisionDwg) {
                    var y1 = system.zone.uly + system.delta_y/2;
                    var y2 = y1 + 2*system.delta_y;
                    var x1 = snapCoords.x;

                    gui.divisionDwg = gui.rendEng.createLine([x1, y1, x1, y2], divProps);
                    gui.rendEng.draw({fixed: [gui.divisionDwg], modify: []}, {selectable: false, opacity: 0.6});
                }
                break;
            case "div_major":
                snapCoords.y = system.zone.uly + (system.zone.lry - system.zone.uly)/2;

                if (!gui.divisionDwg) {
                    var y1 = system.zone.uly;
                    var y2 = system.zone.lry;
                    var x1 = snapCoords.x;

                    gui.divisionDwg = gui.rendEng.createLine([x1, y1, x1, y2], divProps);
                    gui.rendEng.draw({fixed: [gui.divisionDwg], modify: []}, {selectable: false, opacity: 0.6});
                }
                break;
            case "div_final":
                snapCoords.y = system.zone.uly + (system.zone.lry - system.zone.uly)/2;

                if (!gui.divisionDwg) {
                    var y1 = system.zone.uly;
                    var y2 = system.zone.lry;
                    var x1 = snapCoords.x;
                    // make width equal to width of punctum glyph
                    var x2 = snapCoords.x + gui.punctWidth;

                    var div1 = gui.rendEng.createLine([x1, y1, x1, y2], divProps);
                    var div2 = gui.rendEng.createLine([x2, y1, x2, y2], divProps);
                    gui.divisionDwg = gui.rendEng.draw({fixed: [div1, div2], modify: []}, {group: true, selectable: false, opacity: 0.6})[0];
                }
                break;
        }                    

        // snap the drawing to the system on the x-plane
        var dwgLeft = pnt.x - gui.divisionDwg.currentWidth/2;
        var dwgRight = pnt.x + gui.divisionDwg.currentWidth/2;
        if (system.elements[0] instanceof Toe.Model.Clef && dwgLeft <= system.elements[0].zone.lrx) {
            snapCoords.x = system.elements[0].zone.lrx + gui.divisionDwg.currentWidth/2 + 1;
        }
        else if (dwgLeft <= system.zone.ulx) {
            snapCoords.x = system.zone.ulx + gui.divisionDwg.currentWidth/2 + 1;
        }

        if (system.custos && dwgRight >= system.custos.zone.ulx) {
            // 3 is a magic number just to give it some padding
            snapCoords.x = system.custos.zone.ulx - gui.divisionDwg.currentWidth/2 - 3;
        }
        else if (dwgRight >= system.zone.lrx) {
            snapCoords.x = system.zone.lrx - gui.divisionDwg.currentWidth/2 - 3;
        }

        // move around the drawing
        gui.divisionDwg.left = snapCoords.x;
        gui.divisionDwg.top = snapCoords.y;
        gui.rendEng.repaint();
    });

    // handle the actual insertion
    gui.rendEng.canvas.observe('mouse:up', function(e) {
        // get coords
        var coords = {x: gui.divisionDwg.left, y: gui.divisionDwg.top};

        // calculate snapped coords
        var snapCoords = system.getSystemSnapCoordinates(coords, gui.divisionDwg.currentWidth);

        var division = new Toe.Model.Division(divisionForm);

        // update bounding box with physical position on the page
        var ulx = snapCoords.x - gui.divisionDwg.currentWidth/2;
        var uly = snapCoords.y - gui.divisionDwg.currentHeight/2;
        var bb = [ulx, uly, ulx + gui.divisionDwg.currentWidth, uly + gui.divisionDwg.currentHeight];
        division.setBoundingBox(bb);

        // instantiate division view and controller
        var dView = new Toe.View.DivisionView(gui.rendEng);
        var dCtrl = new Toe.Ctrl.DivisionController(division, dView);

        // mount division on the system
        var nInd = system.addDivision(division);

        var outbb = gui.getOutputBoundingBox(bb);
        var args = {type: division.key.slice(4), ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3]};
        // get next element to insert before
        if (nInd + 1 < system.elements.length) {
            args["beforeid"] = system.elements[nInd+1].id;   
        }
        else {
            // insert before the next system break (system)
            var sNextModel = gui.page.getNextSystem(system);
            args["beforeid"] = sNextModel.id;
        }

        // send insert division command to server to change underlying MEI
        $.post(gui.apiprefix + "/insert/division", args, function(data) {
            division.id = JSON.parse(data).id;
        })
        .error(function() {
            this.showAlert("Server failed to insert division. Client and server are not synchronized.");
        });
    });

    $("#rad_small").bind("click.insert", function() {
        // remove the current division following the pointer
        if (gui.divisionDwg) {
            gui.rendEng.canvas.remove(gui.divisionDwg);
            gui.divisionDwg = null;
        }
        divisionForm = "div_small";
    });

    $("#rad_minor").bind("click.insert", function() {
        if (gui.divisionDwg) {
            gui.rendEng.canvas.remove(gui.divisionDwg);
            gui.divisionDwg = null;
        }
        divisionForm = "div_minor";
    });

    $("#rad_major").bind("click.insert", function() {
        if (gui.divisionDwg) {
            gui.rendEng.canvas.remove(gui.divisionDwg);
            gui.divisionDwg = null;
        }
        divisionForm = "div_major";
    });

    $("#rad_final").bind("click.insert", function() {
        if (gui.divisionDwg) {
            gui.rendEng.canvas.remove(gui.divisionDwg);
            gui.divisionDwg = null;
        }
        divisionForm = "div_final";
    });

    // toggle small division by default
    $("#rad_small").trigger('click');
}

Toe.View.SquareNoteInteraction.prototype.handleInsertSystem = function(e) {
    var gui = e.data.gui;
    gui.unbindEventHandlers();
    gui.removeInsertSubControls();
    gui.insertInsertSystemSubControls();
    gui.updateInsertSystemSubControls();

    // Get the widest system and use its dimensions.  If there is no widest system, forget it!
    var widestSystem = gui.page.getWidestSystem();
    if (widestSystem == null) {
        return;
    }

    // Create the drawing.
    gui.systemDrawing = null;
    var numberOfLines = widestSystem.props.numLines;
    var width = widestSystem.getWidth();
    var deltaY = widestSystem.delta_y;
    var elements = {fixed: new Array(), modify: new Array()};
    for (var li = 0; li < numberOfLines; li++) {
        elements.fixed.push(gui.rendEng.createLine([0, deltaY * li, width, deltaY * li]));
    }
    gui.systemDrawing = gui.rendEng.draw(elements, {group: true, selectable: false, opacity: 0.6})[0];

    // Move the drawing with the pointer.
    gui.rendEng.canvas.observe("mouse:move", function(e) {
        var pnt = gui.rendEng.canvas.getPointer(e.e);
        gui.systemDrawing.left = pnt.x;
        gui.systemDrawing.top = pnt.y;
        gui.rendEng.repaint();
    });

    // Do the insert.
    gui.rendEng.canvas.observe('mouse:up', function(e) {

        // Create bounding box and system then add MVC components.
        var ulx = gui.systemDrawing.left - Math.round(gui.systemDrawing.currentWidth / 2);
        var uly = gui.systemDrawing.top - Math.round(gui.systemDrawing.currentHeight / 2);
        var boundingBox = [ulx, uly, ulx + gui.systemDrawing.currentWidth, uly + gui.systemDrawing.currentHeight];
        var system = new Toe.Model.SquareNoteSystem(boundingBox);
        var systemView = new Toe.View.SystemView(gui.rendEng);
        var systemController = new Toe.Ctrl.SystemController(system, systemView);

        // We also have to adjust the associated system break order number.  Then, we can add it to the page.
        // This MIGHT have an impact on systems after it.
        system.setOrderNumber($('#system_number_slider').val());
        gui.page.addSystem(system);
        gui.updateInsertSystemSubControls();
        var nextSystem = gui.page.getNextSystem(system);

        // Create arguments for our first POST.
        var outbb = gui.getOutputBoundingBox([system.zone.ulx, system.zone.uly, system.zone.lrx, system.zone.lry]);
        var createSystemArguments = {pageid: gui.page.getID(), ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3]};

        // POST system, then cascade into other POSTs.
        $.post(gui.apiprefix + "/insert/system", createSystemArguments, function(data) {
            system.setSystemID(JSON.parse(data).id);
            postSystemBreak();
        })
        .error(function() {
            this.showAlert("Server failed to insert system.  Client and server are not synchronized.");
        });

        // POST system break.
        function postSystemBreak() {

            // Create arguments.
            var createSystemBreakArguments = {ordernumber: system.orderNumber, systemid: system.systemId};
            if (nextSystem != null) {
                createSystemBreakArguments.nextsbid = nextSystem.id;
            }

            // Do POST.  If we had to reorder system breaks, POST those, too.
            $.post(gui.apiprefix + "/insert/systembreak", createSystemBreakArguments, function(data) {
                system.setID(JSON.parse(data).id);
                while (nextSystem != null) {
                    gui.postSystemBreakEdit(nextSystem.id, nextSystem.orderNumber);
                    nextSystem = gui.page.getNextSystem(nextSystem);
                }
            })
            .error(function() {
                this.showAlert("Server failed to insert system break.  Client and server are not synchronized.");
            });
        }
    });
}

Toe.View.SquareNoteInteraction.prototype.handleInsertClef = function(e) {
    var gui = e.data.gui;
    gui.unbindEventHandlers();
    gui.removeInsertSubControls();

    // add clef type toggles
    if ($("#menu_insertclef").length == 0) {
        $("#sidebar-insert").append('<span id="menu_insertclef"><br/>\n<li class="nav-header">Clef Type</li>\n' +
                                    '<li><div class="btn-group" data-toggle="buttons-radio">\n' +
                                    '<button id="rad_doh" class="btn">C</button>\n' +
                                    '<button id="rad_fah" class="btn">F</button>\n' +
                                    '</div>\n</li>\n</span>');
    }

    // current clef shape being inserted.
    var cShape = null;

    // move the drawing with the pointer
    gui.rendEng.canvas.observe("mouse:move", function(e) {
        var pnt = gui.rendEng.canvas.getPointer(e.e);

        var xOffset = 0;
        var yOffset = 0;
        // calculate pointer offset
        // are mostly magic numbers to make the interface look pretty
        // but these are relative scalings to the glyph size so it will
        // work for all global scalings.
        if (cShape == "c") {
            xOffset = gui.clefDwg.currentWidth/4;
        }
        else {
            xOffset = gui.clefDwg.currentWidth/8;
            yOffset = gui.clefDwg.currentHeight/8;
        }
        gui.clefDwg.left = pnt.x - xOffset;
        gui.clefDwg.top = pnt.y + yOffset;

        gui.rendEng.repaint();
    });

    // handle the actual insertion
    gui.rendEng.canvas.observe("mouse:up", function(e) {
        // get coords
        var coords = {x: gui.clefDwg.left, y: gui.clefDwg.top};

        if (cShape == "f") {
            coords.x -= gui.clefDwg.currentWidth/8;
            coords.y -= gui.clefDwg.currentHeight/8;
        }

        // get closest system to insert onto
        var system = gui.page.getClosestSystem(coords);

        // calculate snapped coordinates on the system
        var snapCoords = system.getSystemSnapCoordinates(coords, gui.clefDwg.currentWidth);

        var systemPos = Math.round((system.zone.uly - snapCoords.y) / (system.delta_y/2));

        var clef = new Toe.Model.Clef(cShape, {"systemPos": systemPos});

        // update bounding box with physical position on page
        var ulx = snapCoords.x - gui.clefDwg.currentWidth/2;
        var uly = snapCoords.y - gui.clefDwg.currentHeight/2;
        var bb = [ulx, uly, ulx + gui.clefDwg.currentWidth, uly + gui.clefDwg.currentHeight];
        clef.setBoundingBox(bb);

        // instantiate clef view and controller
        var cView = new Toe.View.ClefView(gui.rendEng);
        var cCtrl = new Toe.Ctrl.ClefController(clef, cView);

        // mount clef on the system
        var nInd = system.addClef(clef);

        var systemLine = system.props.numLines + systemPos/2;
        var outbb = gui.getOutputBoundingBox([clef.zone.ulx, clef.zone.uly, clef.zone.lrx, clef.zone.lry]);
        var args = {shape: cShape, line: systemLine, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3]};
        // get next element to insert before
        if (nInd + 1 < system.elements.length) {
            args["beforeid"] = system.elements[nInd+1].id;
        }
        else {
            // insert before the next system break
            var sNextModel = gui.page.getNextSystem(system);
            args["beforeid"] = sNextModel.id;
        }

        var neumesOnSystem = system.getPitchedElements({neumes: true, custos: false});
        if (neumesOnSystem.length > 0 && system.getActingClefByEle(neumesOnSystem[0]) == clef) {
            // if the shift of the clef has affected the first neume on this system
            // update the custos on the previous system
            var prevSystem = gui.page.getPreviousSystem(system);
            if (prevSystem) {
                var newPname = neumesOnSystem[0].components[0].pname;
                var newOct = neumesOnSystem[0].components[0].oct;
                gui.handleUpdatePrevCustos(newPname, newOct, prevSystem);
            }
        }

        // gather new pitch information of affected pitched elements
        args["pitchInfo"] = $.map(system.getPitchedElements({clef: clef}), function(e) {
            if (e instanceof Toe.Model.Neume) {
                var pitchInfo = new Array();
                $.each(e.components, function(nInd, n) {
                    pitchInfo.push({pname: n.pname, oct: n.oct});
                });
                return {id: e.id, noteInfo: pitchInfo};
            }
            else if (e instanceof Toe.Model.Custos) {
                // the custos has been vertically moved
                // update the custos bounding box information in the model
                // do not need to update pitch name & octave since this does not change
                var outbb = gui.getOutputBoundingBox([e.zone.ulx, e.zone.uly, e.zone.lrx, e.zone.lry]);
                $.post(gui.apiprefix + "/move/custos", {id: e.id, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3]})
                .error(function() {
                    this.showAlert("Server failed to move custos. Client and server are not synchronized.");
                });
            }
        });

        // send insert clef command to the server to change underlying MEI
        $.post(gui.apiprefix + "/insert/clef", {data: JSON.stringify(args)}, function(data) {
            clef.id = JSON.parse(data).id;
        })
        .error(function() {
            this.showAlert("Server failed to insert clef. Client and server are not synchronized.");
        });
    });

    // release old bindings
    $("#rad_doh").unbind("click");
    $("#rad_fah").unbind("click");

    $("#rad_doh").bind("click.insert", function() {
        // only need to update following drawing if the clef
        // shape is different
        if (!$(this).hasClass("active")) {
            // initially set clefshape of the screen
            var cPos = {left: -50, top: -50};
            if (gui.clefDwg) {
                gui.rendEng.canvas.remove(gui.clefDwg);
                // draw the new clef at the old clef's location
                cPos = {left: gui.clefDwg.left, top: gui.clefDwg.top};
            }

            var cGlyph = gui.rendEng.getGlyph("c_clef");
            var clef = cGlyph.clone().set($.extend(cPos, {opacity: 0.6}));
            gui.clefDwg = gui.rendEng.draw({fixed: [], modify: [clef]}, {opacity: 0.6, selectable: false, repaint: true})[0];

            cShape = "c";
        }
    });

    $("#rad_fah").bind("click.insert", function() {
        // only need to update following drawing if the clef
        // shape is different
        if (!$(this).hasClass("active")) {
            // initially set clefshape of the screen
            var cPos = {left: -50, top: -50};
            if (gui.clefDwg) {
                gui.rendEng.canvas.remove(gui.clefDwg);
                // draw the new clef at the old clef's location
                cPos = {left: gui.clefDwg.left, top: gui.clefDwg.top};
            }

            var cGlyph = gui.rendEng.getGlyph("f_clef");
            var clef = cGlyph.clone().set($.extend(cPos, {opacity: 0.6}));
            gui.clefDwg = gui.rendEng.draw({fixed: [], modify: [clef]}, {opacity: 0.6, selectable: false, repaint: true})[0];

            cShape = "f";
        }
    });

    // toggle doh clef by default
    $("#rad_doh").trigger("click");
}

Toe.View.SquareNoteInteraction.prototype.handleUpdatePrevCustos = function(pname, oct, prevSystem) {
    var custos = prevSystem.custos;
    if (custos) {
        // update the custos
        custos.setRootNote(pname, oct);
        
        // get acting clef for the custos 
        var actingClef = prevSystem.getActingClefByEle(custos);
        custos.setRootSystemPos(prevSystem.calcSystemPosFromPitch(pname, oct, actingClef));
        var outbb = this.getOutputBoundingBox([custos.zone.ulx, custos.zone.uly, custos.zone.lrx, custos.zone.lry]);
        $.post(this.apiprefix + "/move/custos", {id: custos.id, pname: pname, oct: oct, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3]})
        .error(function() {
            this.showAlert("Server failed to move custos. Client and server are not synchronized.");
        });
    }
    else {
        // insert a custos
        var cModel = new Toe.Model.Custos(pname, oct);

        // create bounding box hint
        var ulx = prevSystem.zone.lrx - gui.punctWidth/2;
        var uly = prevSystem.zone.uly; // probably not correct, but sufficient for the hint
        var bb = [ulx, uly, ulx + gui.punctWidth, uly + gui.punctHeight];
        cModel.setBoundingBox(bb);

        // instantiate custos view and controller
        var cView = new Toe.View.CustosView(gui.rendEng);
        var cCtrl = new Toe.Ctrl.CustosController(cModel, cView);

        // mount the custos on the system
        prevSystem.setCustos(cModel);

        var outbb = this.getOutputBoundingBox([cModel.zone.ulx, cModel.zone.uly, cModel.zone.lrx, cModel.zone.lry]);
        var args = {id: cModel.id, pname: pname, oct: oct, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3]};

        // get id of the next system element
        var nextSystem = gui.page.getNextSystem(prevSystem);
        if (nextSystem) {
            args["beforeid"] = nextSystem.id;
        }

        // update underlying MEI file
        $.post(this.apiprefix + "/insert/custos", args, function(data) {
            cModel.id = JSON.parse(data).id;
        }).error(function() {
            this.showAlert("Server failed to insert custos. Client and server are not synchronized.");
        });
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Edit Methods
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Deletes the active selection.
 *
 * NOTE - moved out of handler to allow for deletion when no trigger is fired.
 */
Toe.View.SquareNoteInteraction.prototype.deleteActiveSelection = function(aGui) {
    // get current canvas selection
    // check individual selection and group selections
    toDelete = {clefs: [],
                nids: [],
                dids: [],
                cids: [],
                systemIdArray: [],
                systemBreakIdArray: []};

    // Some systems may have to be adjusted.
    var adjustedSystemBreakArray = [];

    var deleteClef = function(drawing, aIgnorePitchInfo) {
        var clef = drawing.eleRef;
        var system = clef.system;

        // get previous acting clef
        //  (NOTE: this should always be defined
        // since the first clef on a system is not allowed to be deleted)
        var pClef = system.getPreviousClef(clef);

        // now delete the clef, and update the pitch information of these elements
        system.removeElementByRef(clef);

        // get references to pitched elements that will be changed after
        // the clef is deleted (but only if required).
        var pitchInfo = null;
        if (!aIgnorePitchInfo) {

            system.updatePitchedElements(pClef);
            var pitchedEles = system.getPitchedElements(clef);

            // gather the pitch information of the pitched notes
            pitchInfo = $.map(pitchedEles, function(e) {
                if (e instanceof Toe.Model.Neume) {
                    var pitchInfo = [];
                    $.each(e.components, function(nInd, n) {
                        pitchInfo.push({pname: n.pname, oct: n.oct});
                    });
                    return {id: e.id, noteInfo: pitchInfo};
                }
                else if (e instanceof Toe.Model.Custos) {
                    // the custos has been vertically moved
                    // update the custos bounding box information in the model
                    // do not need to update pitch name & octave since this does not change
                    var outbb = aGui.getOutputBoundingBox([e.zone.ulx, e.zone.uly, e.zone.lrx, e.zone.lry]);
                    $.post(aGui.apiprefix + "/move/custos", {id: e.id, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3]})
                    .error(function() {
                        this.showAlert("Server failed to move custos. Client and server are not synchronized.");
                    });
                }
            });
        }

        toDelete.clefs.push({id: clef.id, pitchInfo: pitchInfo});

        aGui.rendEng.canvas.remove(drawing);
    };

    var deleteNeume = function(drawing) {
        var neume = drawing.eleRef;

        var neumesOnSystem = neume.system.getPitchedElements({neumes: true, custos: false});

        neume.system.removeElementByRef(neume);
        toDelete.nids.push(neume.id);

        aGui.rendEng.canvas.remove(drawing);

        if (neumesOnSystem.length == 1) {
            // there are no neumes left on the system
            // remove the custos from the previous system
            var prevSystem = aGui.page.getPreviousSystem(neume.system);
            if (prevSystem && prevSystem.custos) {
                prevSystem.custos.eraseDrawing();
                prevSystem.removeElementByRef(prevSystem.custos);

                // send the custos delete command to the server to update the underlying MEI
                $.post(aGui.apiprefix + "/delete/custos", {ids: prevSystem.custos.id})
                .error(function() {
                    this.showAlert("Server failed to delete custos. Client and server are not synchronized.");
                });

                prevSystem.custos = null;
            }
        }
        else if (neume == neumesOnSystem[0]) {
            // if this neume is the first neume on the system
            // update the custos of the previous system
            var prevSystem = aGui.page.getPreviousSystem(neume.system);
            if (prevSystem && prevSystem.custos) {
                var custos = prevSystem.custos;
                var nextNeume = neumesOnSystem[1];
                var newPname = nextNeume.components[0].pname;
                var newOct = nextNeume.components[0].oct;
                
                var actingClef = prevSystem.getActingClefByEle(custos);
                var newSystemPos = prevSystem.calcSystemPosFromPitch(newPname, newOct, actingClef);

                custos.pname = newPname;
                custos.oct = newOct;
                custos.setRootSystemPos(newSystemPos);

                // the custos has been vertically moved
                // update the custos bounding box information in the model
                // do not need to update pitch name & octave since this does not change
                var outbb = aGui.getOutputBoundingBox([custos.zone.ulx, custos.zone.uly, custos.zone.lrx, custos.zone.lry]);
                $.post(aGui.apiprefix + "/move/custos",
                      {id: custos.id, pname: newPname, oct: newOct, ulx: outbb[0], uly: outbb[1], lrx: outbb[2], lry: outbb[3]})
                .error(function() {
                    this.showAlert("Server failed to move custos. Client and server are not synchronized.");
                });
            }
        }
    };

    var deleteDivision = function(drawing) {
        var division = drawing.eleRef;

        division.system.removeElementByRef(division);
        toDelete.dids.push(division.id);

        aGui.rendEng.canvas.remove(drawing);
    };

    var deleteCustos = function(drawing) {
        var custos = drawing.eleRef;

        custos.system.removeElementByRef(custos);
        custos.system.custos = null;
        toDelete.cids.push(custos.id);

        aGui.rendEng.canvas.remove(drawing);
    };

    var deleteSystem = function(aDrawing) {
        var systemElementReference = aDrawing.eleRef;
        toDelete.systemBreakIdArray.push(systemElementReference.id);
        toDelete.systemIdArray.push(systemElementReference.systemId);

        // Remove all associated elements of the system.
        var elementIndex = 0;
        doneRemovingElements = false;
        while (!doneRemovingElements) {

            if (systemElementReference.elements.length === 0 || elementIndex >= systemElementReference.elements.length) {
                doneRemovingElements = true;
            }
            else {
                var subElement = systemElementReference.elements[elementIndex];
                var elementDrawing = subElement.view.drawing;
                if (subElement instanceof Toe.Model.Clef) {
                    deleteClef(elementDrawing, true);
                }
                else if (subElement instanceof Toe.Model.Neume) {
                    deleteNeume(elementDrawing);
                }
                else if (subElement instanceof Toe.Model.Division) {
                    deleteDivision(elementDrawing);
                }
                else if (subElement instanceof Toe.Model.Custos) {
                    deleteCustos(elementDrawing);
                }
                else {
                    elementIndex++;
                }
            }
        }
        var returnedArray = aGui.page.removeSystem(systemElementReference);
        adjustedSystemBreakArray = adjustedSystemBreakArray.concat(returnedArray);
        aGui.rendEng.canvas.remove(aDrawing);
    };

    var selection = aGui.rendEng.canvas.getActiveObject();
    if (selection) {
        // ignore the first clef, since this should never be deleted
        if (selection.eleRef instanceof Toe.Model.Clef && selection.eleRef.system.elements[0] != selection.eleRef) {
            deleteClef(selection, false);
        }
        else if (selection.eleRef instanceof Toe.Model.Neume) {
            deleteNeume(selection);
        }
        else if (selection.eleRef instanceof Toe.Model.Division) {
            deleteDivision(selection);
        }
        else if (selection.eleRef instanceof Toe.Model.Custos) {
            deleteCustos(selection);
        }
        else if (selection.eleRef instanceof Toe.Model.System) {
            deleteSystem(selection);
        }
        aGui.rendEng.repaint();
    }
    else {
        selection = aGui.rendEng.canvas.getActiveGroup();
        if (selection) {
            // group of elements selected
            $.each(selection.getObjects(), function(oInd, o) {
                // ignore the first clef, since this should never be deleted
                if (o.eleRef instanceof Toe.Model.Clef && o.eleRef.system.elements[0] != o.eleRef) {
                    deleteClef(o, false);
                }
                else if (o.eleRef instanceof Toe.Model.Neume) {
                    deleteNeume(o);
                }
                else if (o.eleRef instanceof Toe.Model.Division) {
                    deleteDivision(o);
                }
                else if (o.eleRef instanceof Toe.Model.Custos) {
                    deleteCustos(o);
                }
            });
            aGui.rendEng.canvas.discardActiveGroup();
            aGui.rendEng.repaint();
        }
    }

    // Call the server to delete stuff.
    if (toDelete.nids.length > 0) {
        // send delete command to server to change underlying MEI
        $.post(aGui.apiprefix + "/delete/neume",  {ids: toDelete.nids.join(",")})
        .error(function() {
            this.showAlert("Server failed to delete neume. Client and server are not synchronized.");
        });
    }
    if (toDelete.dids.length > 0) {
        // send delete command to server to change underlying MEI
        $.post(aGui.apiprefix + "/delete/division", {ids: toDelete.dids.join(",")})
        .error(function() {
            this.showAlert("Server failed to delete division. Client and server are not synchronized.");
        });
    }
    if (toDelete.cids.length > 0) {
        // send delete command to server to change underlying MEI
        $.post(aGui.apiprefix + "/delete/custos", {ids: toDelete.cids.join(",")})
        .error(function() {
            this.showAlert("Server failed to delete custos. Client and server are not synchronized.");
        });
    }

    if (toDelete.clefs.length > 0) {
        // send delete command to the server to change underlying MEI
        $.post(aGui.apiprefix + "/delete/clef", {data: JSON.stringify(toDelete.clefs)})
        .error(function() {
            this.showAlert("Server failed to delete clef. Client and server are not synchronized.");
        });
    }

    // Delete system and system breaks.
    if (toDelete.systemIdArray.length > 0) {
        aGui.postSystemDelete(toDelete.systemIdArray);
    }
    if (toDelete.systemBreakIdArray.length > 0) {
        aGui.postSystemBreakDelete(toDelete.systemBreakIdArray);
    }

    // Finally, may have had to adjust some systems.
    if (adjustedSystemBreakArray.length > 0) {

        // Remove duplicates first.
        var uniqueAdjustedSystemBreakArray = [];
        $.each(adjustedSystemBreakArray, function(i, el){
            if($.inArray(el, uniqueAdjustedSystemBreakArray) === -1) uniqueAdjustedSystemBreakArray.push(el);
        });

        // Remove each.
        for (var i = 0; i < adjustedSystemBreakArray.length; i++) {
            aGui.postSystemBreakEditOrder(adjustedSystemBreakArray[i].id, adjustedSystemBreakArray[i].orderNumber);
        }
    }
};


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// POST Methods
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
Toe.View.SquareNoteInteraction.prototype.postSystemBreakEditOrder = function(aSystemId, aOrderNumber) {
    $.post(this.apiprefix + "/modify/systembreak", {sbid: aSystemId, ordernumber: aOrderNumber})
    .error(function() {
        this.showAlert("Server failed to modify system break.  Client and server are not synchronized.");
    });
}

Toe.View.SquareNoteInteraction.prototype.postSystemDelete = function(aSystemIdArray) {
    $.post(this.apiprefix + "/delete/system", {sids: aSystemIdArray.join(",")})
    .error(function() {
        this.showAlert("Server failed to delete system.  Client and server are not synchronized.");
    });
}

Toe.View.SquareNoteInteraction.prototype.postSystemBreakDelete = function(aSystemBreadIdArray) {
    $.post(this.apiprefix + "/delete/systembreak", {sbids: aSystemBreadIdArray.join(",")})
    .error(function() {
        this.showAlert("Server failed to delete system break.  Client and server are not synchronized.");
    });
}

Toe.View.SquareNoteInteraction.prototype.postModifySystemZone = function(aSystemId, aUlx, aUly, aLrx, aLry) {
    $.post(this.apiprefix + "/update/system/zone", {sid: aSystemId,
                                                    ulx: aUlx,
                                                    uly: aUly,
                                                    lrx: aLrx,
                                                    lry: aLry})
    .error(function() {
        this.showAlert("Server failed to update system zone.  Client and server are not synchronized.");
    });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Event Handler Methods
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
Toe.View.SquareNoteInteraction.prototype.handleDelete = function(e) {
    var gui = e.data.gui;
    gui.deleteActiveSelection(e.data.gui);
};

Toe.View.SquareNoteInteraction.prototype.handleEventObjectModified = function(aObject) {

    // Switch on element reference type.
    switch(aObject.target.eleRef.constructor) {

        case Toe.Model.SquareNoteSystem:
        {
            console.log(aObject);
            // Fabric uses the center of the object to calc. position.  We don't, so we adjust accordingly.
            aObject.target.eleRef.controller.modifyZone(aObject.target.getCenterPoint().x, aObject.target.currentWidth);

            // Make call to server.
            this.postModifySystemZone(aObject.target.eleRef.systemId,
                                      Math.floor(aObject.target.eleRef.zone.ulx / this.page.scale),
                                      Math.floor(aObject.target.eleRef.zone.uly / this.page.scale),
                                      Math.floor(aObject.target.eleRef.zone.lrx / this.page.scale),
                                      Math.floor(aObject.target.eleRef.zone.lry / this.page.scale));

            // Get the elements that became loose from the system.  Group them and delete.
            var looseElements = aObject.target.eleRef.getLooseElements();
            if (looseElements.length > 0)
            {
                var looseElementDrawings = $.map(looseElements, function(aElement, aIndex) {return aElement.view.drawing;});
                var looseElementGroup = new fabric.Group(looseElementDrawings);
                this.rendEng.canvas.deactivateAll();
                this.rendEng.canvas.setActiveGroup(looseElementGroup);
                this.deleteActiveSelection(this);
            }
            break;
        }

        default:
        {
            break;
        }
    }
};

Toe.View.SquareNoteInteraction.prototype.handleEventObjectSelected = function(aObject) {

    // Unbind and remove previous stuff.
    this.unbindEditSubControls();
    this.removeEditSubControls();

    $('#btn_delete').toggleClass('disabled', false);

    var selection = this.rendEng.canvas.getActiveObject();
    var ele = selection.eleRef;
    if (ele instanceof Toe.Model.Neume) {
        this.showInfo("Selected: " + ele.name +
                     "<br/> Pitche(s): " +
                     $.map(ele.components, function(nc) { return nc.pname.toUpperCase() + nc.oct; }).join(", "));

        $('#btn_ungroup').toggleClass('disabled', false);

        // Setup the neume sub-controls if we selected an editable neume.
        if (ele.typeid == "punctum" || ele.typeid == "cavum" || ele.typeid == "virga") {
            this.insertEditNeumeSubControls();
            this.bindEditNeumeSubControls(ele);
            this.initializeEditNeumeSubControls(ele);
        }
    }
    else if (ele instanceof Toe.Model.Clef) {
        this.showInfo("Selected: " + ele.name);
        this.insertEditClefSubControls(ele);
        this.bindEditClefSubControls(ele);
    }
    else if (ele instanceof Toe.Model.Division) {
        this.showInfo("Selected: " + ele.type);
    }
    else if (ele instanceof Toe.Model.Custos) {
        this.showInfo("Selected: Custos <br/> Pitch: " + ele.pname.toUpperCase() + ele.oct);
    }
    else if (ele instanceof Toe.Model.System) {
        this.showInfo("Selected: system #" + ele.orderNumber);
    }
}

Toe.View.SquareNoteInteraction.prototype.handleEventSelectionCleared = function(aObject) {
    this.hideInfo();
    this.removeEditSubControls();
    $('#btn_delete').toggleClass('disabled', true);
    $('#btn_neumify').toggleClass('disabled', true);
    $('#btn_neumify_liquescence').toggleClass('disabled', true);
    $('#btn_ungroup').toggleClass('disabled', true);
}

Toe.View.SquareNoteInteraction.prototype.handleEventSelectionCreated = function(aObject) {

    var selection = aObject.target;
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
                sModel = o.eleRef.system;
            }
            
            toUngroup++;

            if (o.eleRef.system == sModel) {
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
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GUI Management Methods
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
Toe.View.SquareNoteInteraction.prototype.getOutputBoundingBox = function(bb) {
    gui = this;
    return $.map(bb, function(b) {
        return Math.round(b/gui.page.scale);
    });
}

Toe.View.SquareNoteInteraction.prototype.bindHotKeys = function() {
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

Toe.View.SquareNoteInteraction.prototype.insertEditControls = function(aParentDivId) {
    // add buttons for edit commands
    if ($("#sidebar-edit").length === 0) {
        $(aParentDivId).append('<span id="sidebar-edit"><br/><li class="divider"></li><li class="nav-header">Edit</li>\n' +
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
}

Toe.View.SquareNoteInteraction.prototype.insertEditNeumeSubControls = function() {
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
}

Toe.View.SquareNoteInteraction.prototype.insertEditClefSubControls = function(aElement) {
    if ($("#menu_editclef").length == 0) {
            $("#sidebar-edit").append('<span id="menu_editclef"><br/><li class="nav-header">Clef</li>\n' +
                                      '<li><div class="btn-group" data-toggle="buttons-radio">\n' +
                                      '<button id="edit_rad_c" class="btn">C</button>\n' +
                                      '<button id="edit_rad_f" class="btn">F</button>\n</div></li></span>');
    }

    // activate appropriate radio button
    if (aElement.shape == "c") {
        $("#edit_rad_c").toggleClass("active", true);
    }
    else {
        $("#edit_rad_f").toggleClass("active", true);
    }
}

Toe.View.SquareNoteInteraction.prototype.insertInsertControls = function(aParentDivId) {
    if ($("#sidebar-insert").length == 0) {
        $(aParentDivId).append('<span id="sidebar-insert"><br/><li class="divider"></li><li class="nav-header">Insert</li>\n' +
                              '<li><div class="btn-group" data-toggle="buttons-radio">' +
                              '<button id="rad_punctum" class="btn"><b>■</b> Punctum</button>\n' +
                              '<button id="rad_division" class="btn"><b>||</b> Division</button>\n' + 
                              '<button id="rad_system" class="btn"><b><i class="icon-align-justify icon-black"></i></b>System</button>\n' + 
                              '<button id="rad_clef" class="btn"><b>C/F</b> Clef</button>\n</div>\n</li>\n</span>');
    }
    $("#rad_punctum").bind("click.insert", {gui: this}, this.handleInsertPunctum);
    $("#rad_division").bind("click.insert", {gui: this}, this.handleInsertDivision);
    $("#rad_system").bind("click.insert", {gui: this}, this.handleInsertSystem);
    $("#rad_clef").bind("click.insert", {gui: this}, this.handleInsertClef);
    $("#rad_punctum").trigger('click');
}

Toe.View.SquareNoteInteraction.prototype.unbindEditClefSubControls = function() {
    $("#edit_rad_c").unbind("click");
    $("#edit_rad_f").unbind("click");
}

Toe.View.SquareNoteInteraction.prototype.bindEditClefSubControls = function(aElement) {
    $("#edit_rad_c").bind("click.edit", {gui: this, clef: aElement, shape: "c"}, this.handleClefShapeChange);
    $("#edit_rad_f").bind("click.edit", {gui: this, clef: aElement, shape: "f"}, this.handleClefShapeChange);
}

Toe.View.SquareNoteInteraction.prototype.unbindEditNeumeSubControls = function() {
    $("#edit_chk_dot").unbind("click");
    $("#head_punctum").unbind("click");
    $("#head_cavum").unbind("click");
    $("#head_virga").unbind("click");
    $("#head_quilisma").unbind("click");
    $("#head_punctum_inclinatum").unbind("click");
    $("#head_punctum_inclinatum_parvum").unbind("click");
}

Toe.View.SquareNoteInteraction.prototype.unbindEditSubControls = function() {

    // Neume sub-controls.
    $("#edit_chk_dot").unbind("click");
    $("#head_punctum").unbind("click");
    $("#head_cavum").unbind("click");
    $("#head_virga").unbind("click");
    $("#head_quilisma").unbind("click");
    $("#head_punctum_inclinatum").unbind("click");
    $("#head_punctum_inclinatum_parvum").unbind("click");

    // Clef sub-controls.
    $("#edit_rad_c").unbind("click");
    $("#edit_rad_f").unbind("click");
}

Toe.View.SquareNoteInteraction.prototype.bindEditNeumeSubControls = function(aElement) {
    $("#head_punctum").bind("click.edit", {gui: this, punctum: aElement, shape: "punctum"}, this.handleHeadShapeChange);
    $("#head_cavum").bind("click.edit", {gui: this, punctum: aElement, shape: "cavum"}, this.handleHeadShapeChange);
    $("#head_virga").bind("click.edit", {gui: this, punctum: aElement, shape: "virga"}, this.handleHeadShapeChange);
    $("#head_quilisma").bind("click.edit", {gui: this, punctum: aElement, shape: "quilisma"}, this.handleHeadShapeChange);
    $("#head_punctum_inclinatum").bind("click.edit", {gui: this, punctum: aElement, shape: "punctum_inclinatum"}, this.handleHeadShapeChange);
    $("#head_punctum_inclinatum_parvum").bind("click.edit", {gui: this, punctum: aElement, shape: "punctum_inclinatum_parvum"}, this.handleHeadShapeChange);
    $("#edit_chk_dot").bind("click.edit", {gui: this, punctum: aElement}, this.handleDotToggle);
}

Toe.View.SquareNoteInteraction.prototype.initializeEditNeumeSubControls = function(aElement) {
    var nc = aElement.components[0];
    var hasDot = nc.hasOrnament("dot");
    if (hasDot) {
        $("#edit_chk_dot").toggleClass("active", true);
    }
    else {
        $("#edit_chk_dot").toggleClass("active", false);
    }
}

Toe.View.SquareNoteInteraction.prototype.removeInsertSubControls = function() {
    $("#menu_insertdivision").remove();
    $("#menu_insertclef").remove();
    $("#menu_insertpunctum").remove();
    $("#menu_insertsystem").remove();
    if (this.divisionDwg) {
        this.rendEng.canvas.remove(this.divisionDwg);
    }
    if (this.clefDwg) {
        this.rendEng.canvas.remove(this.clefDwg);
    }
    if (this.punctDwg) {
        this.rendEng.canvas.remove(this.punctDwg);
    }
    if (this.systemDrawing) {
        this.rendEng.canvas.remove(this.systemDrawing);
    }
}

Toe.View.SquareNoteInteraction.prototype.unbindInsertControls = function() {
    $("#rad_punctum").unbind("click");
    $("#rad_division").unbind("click");
    $("#rad_system").unbind("click");
    $("#rad_clef").unbind("click");
}

Toe.View.SquareNoteInteraction.prototype.removeEditSubControls = function () {
    $("#menu_editclef").remove();
    $("#menu_editpunctum").remove();
}

Toe.View.SquareNoteInteraction.prototype.unbindEditControls = function() {
    $("#btn_delete").unbind("click.edit");
    $("#btn_neumify").unbind("click.edit");
}

Toe.View.SquareNoteInteraction.prototype.insertInsertSystemSubControls = function() {
    if ($("#menu_insertsystem").length == 0) {
        $("#sidebar-insert").append('<span id="menu_insertsystem"><br/>\n<li class="nav-header">System Number</li>\n' +
                                    '<li><div><input id="system_number_slider" type="range" min="1" max="1" step="1" value="1">' +
                                    ' <output id="system_number"></output></div></li></span>');
        $("#system_number_slider").change(function() {$('#system_number').html(this.value);}).change();
    }
}

Toe.View.SquareNoteInteraction.prototype.updateInsertSystemSubControls = function() {
    $("#system_number_slider").attr("max", this.page.systems.length + 1);
    $("#system_number_slider").val(this.page.systems.length + 1);
    $("#system_number_slider").change();
}
