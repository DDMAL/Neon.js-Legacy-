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
 * Creates a new neume view
 *
 * @class View for the neume
 * @param {Toe.View.RenderEngine} renderEngine The rendering engine
 */
Toe.View.NeumeView = function(renderEngine, documentType) {
    this.rendEng = renderEngine;
    
    // dynamically call the drawing function for the right manuscript
    switch (documentType) {
        case "liber":
            Toe.View.NeumeView.prototype.drawNeume = drawLiberNeume;
            break;
        case "salzinnes":
            Toe.View.NeumeView.prototype.drawNeume = drawSalzinnesNeume;
            break;
        case "stgallen":
            Toe.View.NeumeView.prototype.drawNeume = drawHartkerNeume;
            break;
        default:
            throw "Invalid Drawing Library";
    }

    this.drawing = null;
    this.ledgerLines = null;
}

Toe.View.NeumeView.prototype.constructor = Toe.View.NeumeView;

/*********************************
 *      HELPER FUNCTIONS         *
 *********************************/
Toe.View.NeumeView.prototype.calcNoteYPos = function(neume) {
    var staff = neume.staff;

    // derive positions of neume components
    var nc_y = new Array();

    // set root note y pos
    nc_y.push(staff.zone.uly - neume.rootStaffPos*staff.delta_y/2);
    for (var i = 1; i < neume.components.length; i++) {
        nc_y.push(nc_y[0] + (-neume.components[i].pitchDiff * staff.delta_y/2));
    }

    return nc_y;
}

Toe.View.NeumeView.prototype.bestDotPlacements = function(staff, nc_y, yposInd) {
    // corresponding to whether or not it is good to put a dot
    // at the middle, top, or bottom of the neume component
    var bestDots = [false, false, false];
    var dotsy = new Array();

    var firstSpace = staff.zone.uly + staff.delta_y/2;

    ypos = nc_y[yposInd];

    // try middle first
    var midPos = ypos;
    k = Math.round(2*(midPos - firstSpace) / staff.delta_y);
    if (k % 2 == 0) {
        dotsy.push(midPos);
    } 

    // try top next
    var topPos = ypos - staff.delta_y/2;
    var k = Math.round(2*(topPos - firstSpace) / staff.delta_y);

    // check there isn't a note here
    // must also check note after (eg., podatus)
    var isOccNote = false;
    if ((yposInd-1 >= 0 && ypos - staff.delta_y/2 == nc_y[yposInd-1]) || (yposInd+1 < nc_y.length && ypos - staff.delta_y/2 == nc_y[yposInd+1])) {
        isOccNote = true;
    }

    if (k % 2 == 0 && !isOccNote) {
        dotsy.push(topPos);
    }
    
    // try bottom
    var botPos = ypos + staff.delta_y/2;
    k = Math.round(2*(botPos - firstSpace) / staff.delta_y);

    // check there isn't a note here
    isOccNote = false;
    if ((yposInd+1 < nc_y.length && ypos + staff.delta_y/2 == nc_y[yposInd+1]) || (yposInd-1 >= 0 && ypos + staff.delta_y/2 == nc_y[yposInd-1])) {
        isOccNote = true;
    }

    if (k % 2 == 0 && !isOccNote) {
        dotsy.push(botPos);
    } 

    return dotsy;
}

Toe.View.NeumeView.prototype.drawLedgerLines = function(ncStaffPos, centre, width, staff) {
    width *= 0.75;

    var nv = this;
    var ledgers = new Array();
    var bottomStaffPos = 2*(1-staff.props.numLines);
    $.each(ncStaffPos, function(ncInd, staffPos) {
        if (staffPos > 0) {
            for (var i = 0; i <= staffPos; i += 2) {
                var line_y = staff.zone.uly - (i*staff.delta_y/2);
                ledgers.push(nv.rendEng.createLine([centre[ncInd]-width, line_y, centre[ncInd]+width, line_y]));
            }
        }
        else if (staffPos < bottomStaffPos) {
            for (var i = bottomStaffPos; i >= staffPos; i -= 2) {
                var line_y = staff.zone.uly - (i*staff.delta_y/2);
                ledgers.push(nv.rendEng.createLine([centre[ncInd]-width, line_y, centre[ncInd]+width, line_y]));
            }
        }
    });

    this.ledgerLines = this.rendEng.draw({fixed: ledgers, modify: []}, {group: true, selectable: false})[0];
}

/*********************************
 *      VIEW HANDLERS            *
 *********************************/
/**
 * Renders the neume on the canvas
 * 
 * @methodOf Toe.View.NeumeView
 * @param {Toe.Model.Neume} neume Neume to render
 */
Toe.View.NeumeView.prototype.render = function(neume) {
    this.drawNeume(neume);
}

/**
 * Renders the bounding box of the neume
 *
 * @methodOf Toe.View.NeumeView
 * @param {Toe.Model.Neume} neume Neume to render the bounding box
 */
Toe.View.NeumeView.prototype.renderBoundingBox = function(neume) {
    var n_bb = [neume.zone.ulx, neume.zone.uly, neume.zone.lrx, neume.zone.lry];
    this.rendEng.outlineBoundingBox(n_bb, {fill: "green"});
}

Toe.View.NeumeView.prototype.updateDrawing = function(neume) {
    // if a drawing exists for this neume, update it
    // by removing and drawing again.
    if (this.drawing) {
        this.rendEng.canvas.remove(this.drawing);
    }
    if (this.ledgerLines) {
        this.rendEng.canvas.remove(this.ledgerLines);
        this.ledgerLines = null;
    }

    this.drawNeume(neume);

    // select the new drawing
    this.selectDrawing();

    this.rendEng.repaint();
}

Toe.View.NeumeView.prototype.eraseDrawing = function() {
    if (this.drawing) {
        this.rendEng.canvas.remove(this.drawing);
    }
    if (this.ledgerLines) {
        this.rendEng.canvas.remove(this.ledgerLines);
        this.ledgerLines = null;
    }

    this.rendEng.repaint();
}

Toe.View.NeumeView.prototype.selectDrawing = function() {
    this.rendEng.canvas.setActiveObject(this.drawing);
}
