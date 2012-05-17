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
Toe.View.GUI = function(prefix, fileName, rendEng, page, guiToggles) {
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

    this.rendEng = rendEng;
    this.page = page;

    // set up punctum that follows the pointer in insert mode
    this.punctGlyph = this.rendEng.getGlyph("punctum");
    this.punct = this.punctGlyph.clone();
    this.objMoving = false;

    // cache reference to this
    gui = this;

    /********************************************************
     *                      NAVBAR                          *
     ********************************************************/
    var nav_file_dropdown_parent = "#nav_file_dropdown";
    $(nav_file_dropdown_parent).prepend('<li><a id="nav_file_dropdown_revert" href="#">Revert</a></li>');
    $("#nav_file_dropdown_revert").tooltip({animation: true, placement: 'bottom', title: 'Revert the current MEI file to the original version. Warning: this will revert all changes made in the editor.', delay: 100});
    $("#nav_file_dropdown_revert").click(function() {
        // move backup mei file to working directory
        $.get(prefix + "/revert/" + fileName, function(data) {
            // when the backup file has been restored, reload the page
            window.location = prefix + "/editor/" + fileName;
        })
        .error(function() {
            // show alert to user
            // replace text with error message
            $("#alert > p").text("Server failed to restore backup MEI file.");
            $("#alert").animate({opacity: 1.0}, 100);

        });
    });

    /********************************************************
     *                     SIDEBAR                          *
     ********************************************************/
    var side_parentDivId = "#gui-sidebar";

    // create background image opacity slider
    if (toggles.sldr_bgImgOpacity) {
        $(side_parentDivId).prepend('<span id="sidebar-bg"><li class="nav-header">Background</li>\n<li>\n<label for="sldr_bgImgOpacity"><b>Image Opacity</b>:</label>\n<input id="sldr_bgImgOpacity" type="range" name="bgImgOpacity" min="0.0" max="1.0" step="0.05" value="' + toggles.initBgImgOpacity + '" />\n</li></span>');

        $("#sldr_bgImgOpacity").bind("change", function() {
            rendEng.canvas.backgroundImageOpacity = $(this).val();
            rendEng.repaint();
        });
    }

    $("#btn_edit").bind("click", function() {
        // first remove insert options
        $(side_parentDivId + "> #sidebar-insert").remove();

        // unbind insert event handlers
        rendEng.unObserve("mouse:move");
        rendEng.unObserve("mouse:up");
        rendEng.canvas.remove(gui.punct);
        rendEng.repaint();
               
        if ($(side_parentDivId + "> #sidebar-edit").length == 0) {
            $(side_parentDivId).append('<span id="sidebar-edit"><br /><li class="nav-header">Edit</li>\n<li>\n<button id="btn_delete" class="btn"><i class="icon-remove"></i> Delete</button>\n</li>\n<li>\n<div class="btn-group">\n<button id="btn_neumify" class="btn"><i class="icon-magnet"></i> Neumify</button><button id="btn_ungroup" class="btn"><i class="icon-share"></i> Ungroup</button></div></li></span>');
        }
        
        rendEng.canvas.observe('mouse:down', function(e) {
            // cache pointer coordinates for mouse up
            gui.downCoords = rendEng.canvas.getPointer(e.memo.e);
        });

        rendEng.canvas.observe('object:moving', function(e) {
            gui.objMoving = true;
        });

        rendEng.canvas.observe('object:selected', function(e) {
            var selection = rendEng.canvas.getActiveObject();
            if (selection.eleRef instanceof Toe.Model.Neume) {
                console.log(selection.eleRef);
                $("#info > p").text("Selected: " + selection.eleRef.props.type.name);
                $("#info").animate({opacity: 1.0}, 100);
            }
        });

        rendEng.canvas.observe('selection:cleared', function(e) {
            $("#info").animate({opacity: 0.0}, 100);
        });

        rendEng.canvas.observe('mouse:up', function(e) {
            var upCoords = rendEng.canvas.getPointer(e.memo.e);

            // get delta of the mouse movement
            var delta_x = gui.downCoords.x - upCoords.x;
            var delta_y = gui.downCoords.y - upCoords.y;
            var thresh = 1;
            // don't perform dragging action if the mouse doesn't move
            if (!gui.objMoving) {
                return;
            }
            
            // if something is selected we need to do some housekeeping
            var selection = rendEng.canvas.getActiveObject();
            if (selection) {
                var elements = new Array();
                if (selection.eleRef && selection.staffRef) {
                    elements.push(selection);
                }
                else {
                    $.each(selection.objects, function(ind, el) {
                        elements.push(el);
                    });
                }

                $.each(elements, function(ind, element) {
                    var ele = element.eleRef;

                    // a single neume has been dragged
                    if (ele instanceof Toe.Model.Neume) {
                        // we have a neume, this is a pitch shift
                        var left = element.left;
                        var top = element.top;
                        if (elements.length > 1) {
                            // calculate object's absolute positions from within selection group
                            left = selection.left + element.left;
                            top = selection.top + element.top;
                        }

                        // get y position of first neume component
                        var nc_y = element.staffRef.clef.y - (ele.rootDiff * element.staffRef.delta_y/2);
                        //var finalCoords = {x: element.left - delta_x, y: nc_y - delta_y};
                        var finalCoords = {x: left, y: nc_y - delta_y};

                        var sModel = page.getClosestStaff(finalCoords);
                        
                        // snap to staff
                        var snapCoords = sModel.ohSnap(finalCoords, element.currentWidth, {ignoreEle: ele});

                        var ncdelta_y = nc_y - snapCoords.y;

                        // change certain attributes of the element
                        // [ulx, uly, lrx, lry]
                        // construct bounding box hint: bounding box changes when dot is repositioned
                        var ulx = snapCoords.x-(element.currentWidth/2);
                        var uly = top-(element.currentHeight/2)-(finalCoords.y-snapCoords.y);
                        var bb = [ulx, uly, ulx + element.currentWidth, uly + element.currentHeight];
                        ele.setBoundingBox(bb);

                        // derive pitch name and octave of notes in the neume on the appropriate staff
                        var oldRootPname = ele.components[0].pname;
                        var oldRootOct = ele.components[0].oct;
                        for (var i = 0; i < ele.components.length; i++) {
                            var noteInfo = sModel.calcNoteInfo({x: snapCoords.x, y: snapCoords.y - (sModel.delta_y/2 * ele.components[i].pitchDiff)});
                            ele.components[i].setPitchInfo(noteInfo["pname"], noteInfo["oct"]);
                        }

                        // remove the old neume
                        element.staffRef.removeElementByRef(ele);
                             
                        // mount the new neume on the most appropriate staff
                        var nInd = sModel.addNeume(ele);

                        // get final bounding box information
                        bb = [ele.zone.ulx, ele.zone.uly, ele.zone.lrx, ele.zone.lry];

                        rendEng.canvas.remove(element);

                        var args = {"nid": ele.id, "bb": {"ulx": bb[0], "uly": bb[1], "lrx": bb[2], "lry": bb[3]}};
                        if (oldRootPname != ele.components[0].pname || oldRootOct != ele.components[0].oct) {
                            // this is a pitch shift
                            args.pitchInfo = new Array();
                            $.each(ele.components, function(ncInd, nc) {
                                args.pitchInfo.push({"pname": nc.pname, "oct": nc.oct});
                            });
                        }
                        else {
                            args.pitchInfo = null
                        }

                        // get next element to insert before
                        if (nInd + 1 < sModel.elements.length) {
                            args["beforeid"] = sModel.elements[nInd+1].id;
                        }
                        else {
                            // insert before the next system break (staff)
                            var sNextModel = page.getNextStaff(sModel);
                            args["beforeid"] = sNextModel.id;
                        }

                        // send pitch shift command to server to change underlying MEI
                        /*$.post(prefix + "/edit/" + fileName + "/change/note", {data: JSON.stringify(args)})
                        .error(function() {
                            // show alert to user
                            // replace text with error message
                            $(".alert > p").text("Server failed to delete note. Client and server are not syncronized.");
                            $(".alert").toggleClass("fade");
                        });*/
                    }
                    else if (ele instanceof Toe.Model.Custos) {

                    }
                    else if (ele instanceof Toe.Model.Clef) {
                        // this is a clef
                    }
                    else if (ele instanceof Toe.Model.Division) {
                        // this is a division
                    }
                });
                // repaint canvas after all the dragging is done
                rendEng.canvas.discardActiveObject();
                rendEng.canvas.discardActiveGroup();
                rendEng.canvas.fire('selection:cleared');
                rendEng.repaint();
            }
            // we're all done moving
            gui.objMoving = false;    
        });

        // handler for delete
        $("#btn_delete").bind("click.edit", function() {
            // get current canvas selection
            // check individual selection and group selections
            nids = new Array();
            var selection = rendEng.canvas.getActiveObject();
            if (selection) {
                // individual element selected
                nids.push(selection.eleRef.id);

                // remove element from internal representation
                selection.staffRef.removeElementByRef(selection.eleRef);

                rendEng.canvas.remove(selection);
                rendEng.canvas.discardActiveObject();
                rendEng.repaint();
            }
            else {
                selection = rendEng.canvas.getActiveGroup();
                if (selection) {
                    // group of neumes selected
                    for (var i = selection.objects.length-1; i >= 0; i--) {
                        nids.push(selection.objects[i].eleRef.id);
                        // remove element from internal representation
                        selection.objects[i].staffRef.removeElementByRef(selection.objects[i].eleRef);

                        rendEng.canvas.remove(selection.objects[i]);
                    }
                    rendEng.canvas.discardActiveGroup();
                    rendEng.repaint();
                }
            }

            // send delete command to server to change underlying MEI
            $.post(prefix + "/edit/" + fileName + "/delete/note",  {ids: nids.join(",")})
            .error(function() {
                // show alert to user
                // replace text with error message
                $("#alert > p").text("Server failed to delete note. Client and server are not syncronized.");
                $("#alert").animate({opacity: 1.0}, 100);
            });
        });

        $("#btn_neumify").bind("click.edit", function() {
            // only need to neumify if a group of objects are selected
            var selection = rendEng.canvas.getActiveGroup();
            if (selection) {
                // there is something selected
                // make sure there are at least 2 neumes on the same staff to work with
                var neumes = new Array();
                var sModel = null;
                $.each(selection.objects, function (ind, el) {
                    if (el.eleRef instanceof Toe.Model.Neume) {
                        if (!sModel) {
                            sModel = el.staffRef;
                        }

                        if (el.staffRef == sModel) {
                            neumes.push({ref: el.eleRef, drawing: el});
                        }
                    }
                });

                if (neumes.length < 2) {
                    return;
                }

                // sort the group based on x position (why fabric doesn't do this, I don't know)
                neumes.sort(function(el1, el2) {
                    return el1.ref.zone.ulx - el2.ref.zone.ulx;
                });

                // begin the NEUMIFICATION
                var newNeume = new Toe.Model.Neume();
                                
                numPunct = 0;
                var nids = new Array();
                var ulx = Number.MAX_VALUE;
                var uly = Number.MAX_VALUE;
                var lry = Number.MIN_VALUE;
                $.each(neumes, function (ind, el) {
                    // grab underlying notes
                    $.merge(newNeume.components, el.ref.components);
                    numPunct += el.ref.components.length;

                    // update neume ids
                    nids.push(el.ref.id);

                    // remove the neume, we don't need it anymore
                    sModel.removeElementByRef(el.ref);
                    rendEng.canvas.remove(el.drawing);

                    // calculate object's absolute positions from within selection group
                    var left = selection.left + el.drawing.left;
                    var top = selection.top + el.drawing.top;
                    
                    ulx = Math.min(ulx, left - el.drawing.currentHeight/2);
                    uly = Math.min(uly, top - el.drawing.currentHeight/2);
                    lry = Math.max(lry, top + el.drawing.currentHeight/2);
                });
                var lrx = ulx + numPunct*gui.punct.width*rendEng.getGlobalScale();

                // set the bounding box hint of the new neume for drawing
                var bb = [ulx, uly, lrx, lry];
                newNeume.setBoundingBox(bb);

                // instantiate neume view and controller
                var nView = new Toe.View.NeumeView(rendEng);
                var nCtrl = new Toe.Ctrl.NeumeController(newNeume, nView);

                // render the new neume
                sModel.addNeume(newNeume);

                // get final bounding box information
                bb = [newNeume.zone.ulx, newNeume.zone.uly, newNeume.zone.lrx, newNeume.zone.lry];

                // get neume key
                var neumeKey = newNeume.props.key;

                // call server neumify function to update MEI
                /*$.post(prefix + "/edit/" + fileName + "/neumify", {nids: nids.join(","), name: neumeKey, ulx: bb[0], uly: bb[1], lrx: bb[2], lry: bb[3]}, function(data) {
                    // set id of the new neume with generated ID from the server
                    newNeume.id = data.nid;
                })
                .error(function() {
                    // show alert to user
                    // replace text with error message
                    $("#alert > p").text("Server failed to neumify selected neumes. Client and server are not syncronized.");
                    $("#alert").toggleClass("fade");
                });*/

                rendEng.canvas.discardActiveGroup();
                rendEng.repaint();
            }
        });

        $("#btn_ungroup").bind("click.edit", function() {
            var neumes = new Array();

            var selection = rendEng.canvas.getActiveObject();
            if (selection) {
                if (selection.eleRef instanceof Toe.Model.Neume && selection.eleRef.components.length > 1) {
                    neumes.push({nRef: selection.eleRef, sRef: selection.staffRef, drawing: selection});
                }
            }
            else {
                selection = rendEng.canvas.getActiveGroup();
                if (selection) {
                    // group of neumes selected
                    for (var i = selection.objects.length-1; i >= 0; i--) {
                        var obj = selection.objects[i];
                        if (obj.eleRef instanceof Toe.Model.Neume && obj.eleRef.components.length > 1) {
                            neumes.push({nRef: obj.eleRef, sRef: obj.staffRef, drawing: obj});
                        }
                    }
                }
            }

            // cache punctum glyph width and height
            var punctWidth = gui.punct.width*rendEng.getGlobalScale();
            var punctHeight = gui.punct.height*rendEng.getGlobalScale();

            var nids = new Array();
            var bbs = new Array();
            var punctums = new Array();

            // ungroup each selected neume
            $.each(neumes, function(nInd, nel) {
                // add to list of neume ids
                nids.push(nel.nRef.id);

                var punctBoxes = new Array();
                var ulx = nel.nRef.zone.ulx;

                // remove the old neume
                nel.sRef.removeElementByRef(nel.nRef);
                rendEng.canvas.remove(nel.drawing);

                $.each(nel.nRef.components, function(ncInd, nc) {
                    var newPunct = new Toe.Model.Neume();
                    newPunct.components.push(nc);

                    var uly = nel.sRef.clef.y - (nel.nRef.rootDiff+nc.pitchDiff)*nel.sRef.delta_y/2 - punctHeight/2;
                    // set the bounding box hint of the new neume for drawing
                    var bb = [ulx+(ncInd*punctWidth), uly, ulx+((ncInd+1)*punctWidth), uly+punctHeight];
                    newPunct.setBoundingBox(bb);

                    // instantiate neume view and controller
                    var nView = new Toe.View.NeumeView(rendEng);
                    var nCtrl = new Toe.Ctrl.NeumeController(newPunct, nView);

                    // add the punctum to the staff and draw it
                    nel.sRef.addNeume(newPunct);

                    // get final bounding box information
                    punctBoxes.push({"ulx": newPunct.zone.ulx, "uly": newPunct.zone.uly, "lrx": newPunct.zone.lrx, "lry": newPunct.zone.lry});

                    punctums.push(newPunct);
                });

                // add to list of neume bounding boxes
                bbs.push(punctBoxes);
            });

            var data = JSON.stringify({"nids": nids.join(","), "bbs": bbs});

            // call server ungroup function to update MEI
            $.post(prefix + "/edit/" + fileName + "/ungroup", {data: data}, function(data) {
                // set ids of the new puncta from the IDs generated from the server
                var nids = JSON.parse(data).nids;
                $.each(punctums, function(i, punct) {
                    punct.id = nids[i];
                });
            })
            .error(function() {
                // show alert to user
                // replace text with error message
                $("#alert > p").text("Server failed to ungroup selected neumes. Client and server are not syncronized.");
                $("#alert").toggleClass("fade");
            });

            rendEng.canvas.discardActiveObject();
            rendEng.canvas.discardActiveGroup();
            rendEng.repaint();
        });
    });

    $("#btn_insert").bind("click.insert", function() {
        // first remove edit options
        $(side_parentDivId + "> #sidebar-edit").remove();

        // unbind edit event handlers
        $("#btn_delete").unbind("click.edit");
        $("#btn_neumify").unbind("click.edit");

        // unbind move event handlers
        rendEng.unObserve("mouse:down");
        rendEng.unObserve("mouse:up");
        rendEng.unObserve("object:moving");
        rendEng.unObserve("object:selected");
        rendEng.unObserve("selection:cleared");

        // then add insert options
        if ($(side_parentDivId + "> #sidebar-insert").length == 0) {
            $(side_parentDivId).append('<span id="sidebar-insert"><br /><li class="nav-header">Insert</li>\n<li>\n<b>Ornamentation</b>:<div class="btn-group" data-toggle="buttons-checkbox">\n<button id="btn_delete" class="btn">Dot</button>\n<button id="btn_horizepisema" class="btn"><i class="icon-resize-horizontal"></i> Episema</button>\n<button id="btn_vertepisema" class="btn"><i class="icon-resize-vertical"></i> Episema</button>\n</div>\n</span>');
        }

        // put the punctum off the screen for now
        gui.punct.set({left: -50, top: -50, opacity: 0.60});
        rendEng.draw({static: [], modify: [gui.punct]}, {repaint: true, selectable: false});

        // render transparent punctum at pointer location
        rendEng.canvas.observe('mouse:move', function(e) {
            var pnt = rendEng.canvas.getPointer(e.memo.e);
            gui.punct.set({left: pnt.x - gui.punctGlyph.centre[0]/2, top: pnt.y - gui.punctGlyph.centre[1]/2});
            rendEng.repaint();
        });

        rendEng.canvas.observe('mouse:up', function(e) {
            var coords = {x: gui.punct.left, y: gui.punct.top};
            var sModel = page.getClosestStaff(coords);

            // instantiate a punctum
            var nModel = new Toe.Model.Neume();

            // calculate snapped coords
            var snapCoords = sModel.ohSnap(coords, gui.punct.currentWidth);

            // update bounding box with physical position on the page
            var ulx = snapCoords.x - gui.punct.currentWidth/2;
            var uly = snapCoords.y - gui.punct.currentHeight/2;
            var bb = [Math.round(ulx), Math.round(uly), Math.round(ulx + gui.punct.currentWidth), Math.round(uly + gui.punct.currentHeight)];
            nModel.setBoundingBox(bb);

            // get pitch name and octave of snapped coords of note
            var noteInfo = sModel.calcNoteInfo(snapCoords);
            var pname = noteInfo["pname"];
            var oct = noteInfo["oct"];

            // TODO: check ornamentation toggles to add to component
            nModel.addComponent("punctum", pname, oct);

            // instantiate neume view and controller
            var nView = new Toe.View.NeumeView(rendEng);
            var nCtrl = new Toe.Ctrl.NeumeController(nModel, nView);
            
            // mount neume on the staff
            var nInd = sModel.addNeume(nModel);

            var args = {pname: pname, oct: oct, ulx: bb[0], uly: bb[1], lrx: bb[2], lry: bb[3]};

            // get next element to insert before
            if (nInd + 1 < sModel.elements.length) {
                args["beforeid"] = sModel.elements[nInd+1].id;
            }
            else {
                // insert before the next system break (staff)
                var sNextModel = page.getNextStaff(sModel);
                args["beforeid"] = sNextModel.id;
            }

            // send insert command to server to change underlying MEI
            $.post(prefix + "/edit/" + fileName + "/new/note", args, function(data) {
                nModel.id = JSON.parse(data).nid;
            })
            .error(function() {
                // show alert to user
                // replace text with error message
                $("#alert > p").text("Server failed to insert note. Client and server are not syncronized.");
                $("#alert").toggleClass("fade");
            });
        });
    });

    // set active button on startup
    $("#btn_" + toggles.initMode).trigger('click');
}

Toe.View.GUI.prototype.constructor = Toe.View.GUI;
