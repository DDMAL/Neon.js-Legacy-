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

    var parentDivId = "#gui-sidebar";

    // create background image opacity slider
    if (toggles.sldr_bgImgOpacity) {
        $(parentDivId).prepend('<span id="sidebar-bg"><li class="nav-header">Background</li>\n<li>\n<label for="sldr_bgImgOpacity"><b>Image Opacity</b>:</label>\n<input id="sldr_bgImgOpacity" type="range" name="bgImgOpacity" min="0.0" max="1.0" step="0.05" value="' + toggles.initBgImgOpacity + '" />\n</li></span>');

        $("#sldr_bgImgOpacity").bind("change", function() {
            rendEng.canvas.backgroundImageOpacity = $(this).val();
            rendEng.repaint();
        });
    }

    $("#btn_edit").bind("click", function() {
        // first remove insert options
        $(parentDivId + "> #sidebar-insert").remove();

        // unbind insert event handlers
        rendEng.unObserve("mouse:move");
        rendEng.unObserve("mouse:up");
        rendEng.canvas.remove(gui.punct);
        rendEng.repaint();
               
        if ($(parentDivId + "> #sidebar-edit").length == 0) {
            $(parentDivId).append('<span id="sidebar-edit"><br /><li class="nav-header">Edit</li>\n<li>\n<button id="btn_delete" class="btn"><i class="icon-remove"></i> Delete</button>\n</li>\n<li>\n<div class="btn-group">\n<button id="btn_neumify" class="btn"><i class="icon-magnet"></i> Neumify</button><button id="btn_ungroup" class="btn"><i class="icon-share"></i> Ungroup</button></div></li></span>');
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
                        var snapInfo = sModel.ohSnap(finalCoords, element.currentWidth, {ignoreID: ele.id});
                        var snapCoords = snapInfo["snapCoords"];
                        var pElementID = snapInfo["pElementID"];

                        var ncdelta_y = nc_y - snapCoords.y;

                        // change certain attributes of the element
                        // [ulx, uly, lrx, lry]
                        // TODO: bounding box changes when dot is repositioned
                        var ulx = snapCoords.x-(element.currentWidth/2);
                        var uly = top-(element.currentHeight/2)-(finalCoords.y-snapCoords.y);
                        var bb = [ulx, uly, ulx + element.currentWidth, uly + element.currentHeight];
                        ele.setBoundingBox(bb);

                        // derive pitch name and octave of notes in the neume on the appropriate staff
                        for (var i = 0; i < ele.components.length; i++) {
                            var noteInfo = sModel.calcNoteInfo({x: snapCoords.x, y: snapCoords.y - (sModel.delta_y/2 * ele.components[i].pitchDiff)});
                            ele.components[i].setPitchInfo(noteInfo["pname"], noteInfo["oct"]);
                        }

                        // remove the old neume
                        element.staffRef.removeElementByRef(ele);
                             
                        // mount the new neume on the most appropriate staff
                        sModel.addNeume(ele);

                        // get final bounding box information
                        bb = [ele.zone.ulx, ele.zone.uly, ele.zone.lrx, ele.zone.lry];

                        rendEng.canvas.remove(element);

                        // send pitch shift command to server to change underlying MEI
                        /*$.post(prefix + "/edit/" + fileName + "/change/note",  {id: nids.join(",")})
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
            $.post(prefix + "/edit/" + fileName + "/delete/note",  {id: nids.join(",")})
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

                // begin the NEUMIFICATION
                var newNeume = new Toe.Model.Neume();
                
                // id of neumified neume is id of first neume in selection
                newNeume.id = neumes[0].ref.id; 
                
                numPunct = 0;
                var ulx = Number.MAX_VALUE;
                var uly = Number.MAX_VALUE;
                var lry = Number.MIN_VALUE;
                $.each(neumes, function (ind, el) {
                    // grab underlying notes
                    $.merge(newNeume.components, el.ref.components);
                    numPunct += el.ref.components.length;

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

                // get neume name
                var neumeName = newNeume.props.type.name;
        
                rendEng.canvas.discardActiveGroup();
                rendEng.repaint();

                console.log(newNeume);
            }
        });
    });

    $("#btn_insert").bind("click.insert", function() {
        // first remove edit options
        $(parentDivId + "> #sidebar-edit").remove();

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
        if ($(parentDivId + "> #sidebar-insert").length == 0) {
            $(parentDivId).append('<span id="sidebar-insert"><br /><li class="nav-header">Insert</li>\n<li>\n<b>Ornamentation</b>:<div class="btn-group" data-toggle="buttons-checkbox">\n<button id="btn_delete" class="btn">Dot</button>\n<button id="btn_horizepisema" class="btn"><i class="icon-resize-horizontal"></i> Episema</button>\n<button id="btn_vertepisema" class="btn"><i class="icon-resize-vertical"></i> Episema</button>\n</div>\n</span>');
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
            var snapInfo = sModel.ohSnap(coords, gui.punct.currentWidth);
            var snapCoords = snapInfo["snapCoords"];
            var pElementID = snapInfo["pElementID"];

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
            sModel.addNeume(nModel);
            
            /*
            // send insert command to server to change underlying MEI
            $.post(prefix + "/edit/" + fileName + "/new/note", {})
            .error(function() {
                // show alert to user
                // replace text with error message
                $(".alert > p").text("Server failed to insert note. Client and server are not syncronized.");
                $(".alert").toggleClass("fade");
            });*/
        });
    });

    // set active button on startup
    $("#btn_" + toggles.initMode).trigger('click');
}

Toe.View.GUI.prototype.constructor = Toe.View.GUI;
