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
Toe.View.NeumeView = function(renderEngine) {
    this.rendEng = renderEngine;
}

Toe.View.NeumeView.prototype.constructor = Toe.View.NeumeView;


/**
 * Renders the neume on the canvas
 * 
 * @methodOf Toe.View.NeumeView
 * @param {Toe.Model.Neume} neume Neume to render
 * @param {Array} nc_y The y positions of each neume component within the neume
 */
Toe.View.NeumeView.prototype.renderNeume = function(neume, nc_y, staff) {
    if (!this.rendEng) {
        throw new Error("Neume: Invalid render context");
    }

    var bestDotPlacements = function(nc_y, yposInd) {
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
        var isOccNote = false;
        if (yposInd-1 >= 0 && ypos - staff.delta_y/2 == nc_y[yposInd-1]) {
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
        if (yposInd+1 < nc_y.length && ypos + staff.delta_y/2 == nc_y[yposInd+1]) {
            isOccNote = true;
        }

        if (k % 2 == 0 && !isOccNote) {
            dotsy.push(botPos);
        } 

        return dotsy;
    };

    var ncOverlap_x = 1; // (pixels)
    
    // get neume component glyphs
    var ncGlyphs = new Array();
    for (var ncInd = 0; ncInd < neume.components.length; ncInd++) {
        var svgKey = null;
        switch (neume.components[ncInd].props.name) {
            case Toe.Model.NeumeComponent.Type.punctum:
                svgKey = "punctum";
                break;
            case Toe.Model.NeumeComponent.Type.whitepunct:
                svgKey = "whitepunct";
                break;
            case Toe.Model.NeumeComponent.Type.inclinatum:
                svgKey = "diamond";
                break;
            case Toe.Model.NeumeComponent.Type.smallinclinatum:
                svgKey = "smalldiamond";
                break;
            case Toe.Model.NeumeComponent.Type.quilisma:
                svgKey = "quilisma";
                break;
        }
        ncGlyphs.push(this.rendEng.getGlyph(svgKey));
    }

    var glyphDot = this.rendEng.getGlyph("dot");
    var elements = new Array();

    switch (neume.props.type) {
        // PUNCTUM
        case Toe.Model.Neume.Type.punctum:
            var glyphPunct = ncGlyphs[0].clone().set({left: neume.zone.ulx + ncGlyphs[0].centre[0], top: nc_y[0]});
            elements.push(glyphPunct);

            // render dots
            if (neume.components[0].hasOrnament('dot')) {
                // get best spot for one dot
                var bestDots = bestDotPlacements(nc_y, 0);
                elements.push(glyphDot.clone().set({left: glyphPunct.left+(2*ncGlyphs[0].centre[0]), top: bestDots[0]}));
            }

            break;

        // VIRGA
        case Toe.Model.Neume.Type.virga:
            var punct = this.rendEng.getGlyph("punctum");
            var glyphPunct = ncGlyphs[0].clone().set({left: neume.zone.ulx + ncGlyphs[0].centre[0], top: nc_y[0]});
            elements.push(glyphPunct);

            // render dots
            if (neume.components[0].hasOrnament('dot')) {
                // get best spot for one dot
                var bestDots = bestDotPlacements(nc_y, 0);
                elements.push(glyphDot.clone().set({left: glyphPunct.left+(2*ncGlyphs[0].centre[0]), top: bestDots[0]}));
            }

            // draw right line coming off punctum
            var rx = glyphPunct.left+ncGlyphs[0].centre[0]-1;
            var line = this.rendEng.createLine([rx, nc_y[0], rx, neume.zone.lry], {strokeWidth: 2, interact: true});
            this.rendEng.draw([line], {modify: false});
            break;

        // CLIVIS
        case Toe.Model.Neume.Type.clivis:
            // if clivis is the liquescence variant
            if (neume.props.modifier == Toe.Model.Neume.Modifier.alt) {
                // first punctum
                var punct1 = this.rendEng.getGlyph("cephalicus");
                var glyphPunct1 = punct1.clone().set({left: neume.zone.ulx + punct1.centre[0], top: nc_y[0] - punct1.centre[1]/2});

                elements.push(glyphPunct1);

                // draw left line coming off first punctum
                var lx = glyphPunct1.left-punct1.centre[0]+1;
                var line = this.rendEng.createLine([lx, nc_y[0], lx, neume.zone.lry], {strokeWidth: 2, interact: true});
                this.rendEng.draw([line], {modify: false});

                // draw right line coming off punctum
                var rx = glyphPunct1.left+punct1.centre[0]-2;
                var line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[1]], {strokeWidth: 2, interact: true});
                this.rendEng.draw([line], {modify: false});

                // second punctum
                var punct2 = this.rendEng.getGlyph("liques_up");
                var glyphPunct2 = punct2.clone().set({left: glyphPunct1.left + punct1.centre[0] - punct2.centre[0], top: nc_y[1] - punct2.centre[1]/2});

                elements.push(glyphPunct2);
            }
            else {  // draw normally
                // first punctum
                var glyphPunct1 = ncGlyphs[0].clone().set({left: neume.zone.ulx + ncGlyphs[0].centre[0], top: nc_y[0]});

                elements.push(glyphPunct1);

                // draw left line coming off first punctum
                var lx = glyphPunct1.left-ncGlyphs[0].centre[0]+1;
                var line = this.rendEng.createLine([lx, nc_y[0], lx, neume.zone.lry], {strokeWidth: 2, interact: true});
                this.rendEng.draw([line], {modify: false});

                // draw right line coming off punctum
                var rx = glyphPunct1.left+ncGlyphs[0].centre[0];
                var line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[1]], {strokeWidth: 2, interact: true});
                this.rendEng.draw([line], {modify: false});

                // second punctum
                var glyphPunct2 = ncGlyphs[1].clone().set({left: glyphPunct1.left+(2*ncGlyphs[1].centre[0]), top: nc_y[1]});

                elements.push(glyphPunct2);

                // render dots
                $.each(neume.components, function(it,el) {
                    if (el.hasOrnament('dot')) {
                        // get best spot for one dot
                        var bestDots = bestDotPlacements(nc_y, it);
                        if (bestDots.length > 0) {
                            elements.push(glyphDot.clone().set({left: glyphPunct2.left+(2*ncGlyphs[1].centre[0]), top: bestDots[0]}));
                        }
                    }
                });
            }
            break;

        // TORCULUS
        case Toe.Model.Neume.Type.torculus:
            // derive x positions
            var nc_x = new Array();
            nc_x.push(neume.zone.ulx + ncGlyphs[0].centre[0]);
            nc_x.push(nc_x[0] + (2*ncGlyphs[0].centre[0])-ncOverlap_x);
            nc_x.push(nc_x[1] + (2*ncGlyphs[1].centre[0])-ncOverlap_x);

            // first punctum
            var glyphPunct1 = ncGlyphs[0].clone().set({left: nc_x[0], top: nc_y[0]});

            elements.push(glyphPunct1);

            // draw right line coming off punctum1
            var rx = glyphPunct1.left+ncGlyphs[0].centre[0]-1;
            var line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[1]], {strokeWidth: 2, interact: true});
            this.rendEng.draw([line], {modify: false});

            // second punctum
            var glyphPunct2 = ncGlyphs[1].clone().set({left: nc_x[1], top: nc_y[1]});

            elements.push(glyphPunct2);

            // draw right line coming off punctum2
            var rx = glyphPunct2.left+ncGlyphs[1].centre[0]-1;
            var line = this.rendEng.createLine([rx, nc_y[1], rx, nc_y[2]], {strokeWidth: 2, interact: true});
            this.rendEng.draw([line], {modify: false});

            // third punctum
            var glyphPunct3 = ncGlyphs[2].clone().set({left: nc_x[2], top: nc_y[2]});

            elements.push(glyphPunct3);

            // render dots
            $.each(neume.components, function(it,el) {
                if (el.hasOrnament('dot')) {
                    // get best spot for one dot
                    var bestDots = bestDotPlacements(nc_y, it);
                    if (bestDots.length > 0) {
                        elements.push(glyphDot.clone().set({left: nc_x[it]+(2*ncGlyphs[1].centre[0]), top: bestDots[0]}));
                    }
                }
            });

            break;

        // PODATUS
        case Toe.Model.Neume.Type.podatus:
            // if punctums are right on top of each other, spread them out a bit
            if (Math.abs(neume.components[1].diff) == 1) {
                nc_y[0] += 1;
                nc_y[1] -= 1;
            }

            // first punctum
            var punct1 = this.rendEng.getGlyph("pes");
            var glyphPunct1 = punct1.clone().set({left: neume.zone.ulx + punct1.centre[0], top: nc_y[0] - punct1.centre[1]/2});

            elements.push(glyphPunct1);

            // draw right line connecting two punctum
            var rx = glyphPunct1.left + punct1.centre[0] - 1;
            var line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[1]], {strokeWidth: 2, interact: true});
            this.rendEng.draw([line], {modify: false});

            // second punctum
            var glyphPunct2 = ncGlyphs[1].clone().set({left: glyphPunct1.left, top: nc_y[1]});

            elements.push(glyphPunct2);

            // render dots
            $.each(neume.components, function(it,el) {
                if (el.hasOrnament('dot')) {
                    // get best spot for one dot
                    var bestDots = bestDotPlacements(nc_y, it);
                    if (bestDots.length > 0) {
                        elements.push(glyphDot.clone().set({left: glyphPunct1.left+(2*ncGlyphs[1].centre[0]), top: bestDots[0]}));
                    }
                }
            });

            break;

        // PORRECTUS
        case Toe.Model.Neume.Type.porrectus:
            // draw swoosh
            var swoosh = this.rendEng.getGlyph("porrect_1");
            var glyphSwoosh = swoosh.clone().set({left: neume.zone.ulx + swoosh.centre[0], top: nc_y[0] + swoosh.centre[1]/2});
            elements.push(glyphSwoosh);

            // draw left line coming off swoosh
            var lx = glyphSwoosh.left - swoosh.centre[0] + 1;
            var ly = neume.zone.lry;
            var swooshBot = glyphSwoosh.top + swoosh.centre[1];
            if (neume.zone.lry < glyphSwoosh.top + swooshBot) {
                ly = swooshBot;
            }
            var line = this.rendEng.createLine([lx, nc_y[0], lx, ly], {strokeWidth: 2, interact: true});
            this.rendEng.draw([line], {modify: false});

            // draw punctum
            var glyphPunct = ncGlyphs[2].clone().set({left: glyphSwoosh.left + swoosh.centre[0] - ncGlyphs[2].centre[0], top: nc_y[2]});

            // draw right line connecting swoosh and punctum
            var rx = glyphPunct.left + ncGlyphs[2].centre[0] - 1;
            var line = this.rendEng.createLine([rx, nc_y[2], rx, nc_y[1]], {strokeWidth: 2, interact: true});
            this.rendEng.draw([line], {modify: false});

            elements.push(glyphPunct);

            // only check last note has a dot
            if(neume.components[2].hasOrnament('dot')) {
                // get best spot for the dot
                var bestDots = bestDotPlacements(nc_y, 2);
                if (bestDots.length > 0) {
                    elements.push(glyphDot.clone().set({left: glyphPunct.left + (2*ncGlyphs[2].centre[0]), top: bestDots[0]}));
                }
            }

            break;

        // SCANDICUS
        case Toe.Model.Neume.Type.scandicus:
            // cache number of neume components
            var numNC = neume.components.length;
            var pes = this.rendEng.getGlyph("pes");
            var lastX = neume.zone.ulx - ncGlyphs[0].centre[0];
            
            // draw podatuses
            for (var i = 0; i < numNC-1; i+=2) {
                // if punctums are right on top of each other, spread them out a bit
                if (Math.abs(neume.components[i+1].diff - neume.components[i].diff) == 1) {
                    nc_y[i] += 1;
                    nc_y[i+1] -= 1;
                }

                // pes
                lastX += 2*pes.centre[0] - ncOverlap_x;
                var glyphPes = pes.clone().set({left: lastX, top: nc_y[i] - pes.centre[1]/2});
                elements.push(glyphPes);

                // draw right line connecting two punctum
                var rx1 = lastX + pes.centre[0] - 1;
                var line1 = this.rendEng.createLine([rx1, nc_y[i], rx1, nc_y[i+1]], {strokeWidth: 2, interact: true});
                this.rendEng.draw([line1], {modify: false});

                // second punctum
                var glyphPunct2 = ncGlyphs[i+1].clone().set({left: lastX, top: nc_y[i+1]});
                elements.push(glyphPunct2);

                // render dots
                for (var ncInd = i; ncInd < i+2; ncInd++) {
                    if (neume.components[ncInd].hasOrnament('dot')) {
                        //get best spot for the dot
                        var bestDots = bestDotPlacements(nc_y, ncInd);
                        if (bestDots.length > 0) {
                            elements.push(glyphDot.clone().set({left: glyphPunct2.left+(2*ncGlyphs[ncInd].centre[0]), top: bestDots[0]}));
                        }
                    }
                }
            }

            if (neume.components.length % 2 == 1) {
                // draw virga
                lastX += 2*ncGlyphs[numNC-1].centre[0] - ncOverlap_x;
                var glyphPunct3 = ncGlyphs[numNC-1].clone().set({left: lastX, top: nc_y[numNC-1]});
                elements.push(glyphPunct3);

                // draw dots on stray virga if they exist
                if(neume.components[numNC-1].hasOrnament('dot')) {
                    // get best spot for the dot
                    var bestDots = bestDotPlacements(nc_y, numNC-1);
                    if (bestDots.length > 0) {
                        elements.push(glyphDot.clone().set({left: glyphPunct3.left + (2*ncGlyphs[numNC-1].centre[0]), top: bestDots[0]}));
                    }
                }

                // draw right line coming off punctum
                var rx2 = lastX + ncGlyphs[numNC-1].centre[0] - 2;
                var line2 = this.rendEng.createLine([rx2, nc_y[numNC-1], rx2, neume.zone.lry - ((neume.zone.lry - neume.zone.uly)/2)], 
                                                    {strokeWidth: 2, interact: true});
                this.rendEng.draw([line2], {modify: false});
            }
            break;
    }
    
    for (i = 0; i < elements.length; i++) {
        elements[i].selectable = neume.props.interact;
        elements[i].hasControls = false;
    }

    this.rendEng.draw(elements);
}
