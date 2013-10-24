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

var drawSalzinnesNeume = function(neume) {
    if (!this.rendEng) {
        throw new Error("Neume: Invalid render context");
    }

    if (this.ledgerLines) {
        this.rendEng.canvas.remove(this.ledgerLines);
    }

    var nc_y = this.calcNoteYPos(neume);

    var system = neume.system;
    var nv = this;

    var ncOverlap_x = 1; // (pixels)
    
    // get neume component glyphs
    var ncGlyphs = new Array();
    for (var ncInd = 0; ncInd < neume.components.length; ncInd++) {
        var svgKey = null;
        switch (neume.components[ncInd].props.name) {
            case Toe.Model.NeumeComponent.Type.punctum:
                svgKey = "punctum";
                break;
            case Toe.Model.NeumeComponent.Type.virga:
                svgKey = "punctum";
                break;
            case Toe.Model.NeumeComponent.Type.cavum:
                svgKey = "whitepunct";
                break;
            case Toe.Model.NeumeComponent.Type.punctum_inclinatum:
                svgKey = "diamond";
                break;
            case Toe.Model.NeumeComponent.Type.punctum_inclinatum_parvum:
                svgKey = "diamond_small";
                break;
            case Toe.Model.NeumeComponent.Type.quilisma:
                svgKey = "quilisma";
                break;
        }
        ncGlyphs.push(this.rendEng.getGlyph(svgKey));
    }

    var glyphDot = this.rendEng.getGlyph("dot");

    // fixed holds elements that will not undergo global transformations
    // modify holds elements that will undergo global transformations
    var elements = {fixed: new Array(), modify: new Array()};

    switch (neume.typeid) {
        case "punctum":
        case "cavum":
            var left = neume.zone.ulx + ncGlyphs[0].centre[0];
            var glyphPunct = ncGlyphs[0].clone().set({left: left, top: nc_y[0]});
            elements.modify.push(glyphPunct);

            // render dots
            if (neume.components[0].hasOrnament('dot')) {
                // get best spot for one dot
                var bestDots = this.bestDotPlacements(system, nc_y, 0);
                elements.modify.push(glyphDot.clone().set({left: glyphPunct.left+(2*ncGlyphs[0].centre[0]), top: bestDots[0]}));
            }

            this.drawLedgerLines([neume.rootSystemPos], [left], ncGlyphs[0].centre[0]*2, system);

            break;

        // DISTROPHA
        case "distropha":
        case "tristropha":
            var nc_x = new Array();
            nc_x.push(neume.zone.ulx + ncGlyphs[0].centre[0]);

            for (var it = 0; it < neume.components.length; it++) {
                var glyphPunct = ncGlyphs[it].clone().set({left: nc_x[it], top: nc_y[it]});
                elements.modify.push(glyphPunct);

                // calculate nc_x for following punctum
                nc_x.push(nc_x[it] + (3*ncGlyphs[it].centre[0]));
            };

            // render dots
            $.each(neume.components, function(it,el) {
                if (el.hasOrnament('dot')) {
                    // get best spot for one dot
                    var bestDots = nv.bestDotPlacements(system, nc_y, it);
                    if (bestDots.length > 0) {
                        elements.modify.push(glyphDot.clone().set({left: nc_x[nc_x.length-1], top: bestDots[0]}));
                    }
                }
            });

            this.drawLedgerLines($.map(neume.components, function(nc) {
                return neume.rootSystemPos + nc.pitchDiff;
            }), nc_x, ncGlyphs[0].centre[0]*2, system);
            break;

        // VIRGA
        case "virga":
            var left = neume.zone.ulx + ncGlyphs[0].centre[0];
            var glyphPunct = ncGlyphs[0].clone().set({left: left, top: nc_y[0]});
            elements.modify.push(glyphPunct);

            // render dots
            if (neume.components[0].hasOrnament('dot')) {
                // get best spot for one dot
                var bestDots = this.bestDotPlacements(system, nc_y, 0);
                elements.modify.push(glyphDot.clone().set({left: glyphPunct.left+(2*ncGlyphs[0].centre[0]), top: bestDots[0]}));
            }

            // draw right line coming off punctum
            var rx = glyphPunct.left+ncGlyphs[0].centre[0]-1;
            var line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[0] + (3/2)*system.delta_y], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            this.drawLedgerLines([neume.rootSystemPos], [left], ncGlyphs[0].centre[0]*2, system);

            break;

        case "bivirga":
        case "trivirga":
            var nc_x = new Array();
            nc_x.push(neume.zone.ulx + ncGlyphs[0].centre[0]);

            for (var it = 0; it < neume.components.length; it++) {
                var glyphPunct = ncGlyphs[it].clone().set({left: nc_x[it], top: nc_y[it]});
                elements.modify.push(glyphPunct);

                // draw right line coming off punctum
                var rx = glyphPunct.left+ncGlyphs[it].centre[0]-1;
                var line = this.rendEng.createLine([rx, nc_y[it], rx, nc_y[it] + (3/2)*system.delta_y], {strokeWidth: 2, interact: true});
                elements.fixed.push(line);

                // calculate nc_x for following virga
                nc_x.push(nc_x[it] + (3*ncGlyphs[it].centre[0]));
            }

            // render dots
            $.each(neume.components, function(it,el) {
                if (el.hasOrnament('dot')) {
                    // get best spot for one dot
                    var bestDots = nv.bestDotPlacements(system, nc_y, it);
                    if (bestDots.length > 0) {
                        elements.modify.push(glyphDot.clone().set({left: nc_x[nc_x.length-1], top: bestDots[0]}));
                    }
                }
            });

            this.drawLedgerLines($.map(neume.components, function(nc) {
                return neume.rootSystemPos + nc.pitchDiff;
            }), nc_x, ncGlyphs[0].centre[0]*2, system);

            break;

        // CLIVIS
        case "clivis":
            // if clivis is the liquescence variant
            var nc_x = new Array();
            // first punctum
            nc_x.push(neume.zone.ulx + ncGlyphs[0].centre[0]);
            var glyphPunct1 = ncGlyphs[0].clone().set({left: nc_x[0], top: nc_y[0]});

            elements.modify.push(glyphPunct1);

            // draw left line coming off first punctum
            //var lx = nc_x[0]-ncGlyphs[0].centre[0]+1;
            //var line = this.rendEng.createLine([lx, nc_y[0], lx, neume.zone.lry], {strokeWidth: 2, interact: true});
            //elements.fixed.push(line);

            // draw right line coming off punctum
            var rx = glyphPunct1.left+ncGlyphs[0].centre[0] - 1;
            line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[1]], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            // second punctum
            nc_x.push(nc_x[0] + (2*ncGlyphs[1].centre[0]));
            var glyphPunct2 = ncGlyphs[1].clone().set({left: nc_x[1], top: nc_y[1]});

            elements.modify.push(glyphPunct2);

            // render dots
            $.each(neume.components, function(it,el) {
                if (el.hasOrnament('dot')) {
                    // get best spot for one dot
                    var bestDots = nv.bestDotPlacements(system, nc_y, it);
                    if (bestDots.length > 0) {
                        elements.modify.push(glyphDot.clone().set({left: glyphPunct2.left+(2*ncGlyphs[1].centre[0]), top: bestDots[0]}));
                    }
                }
            });

            this.drawLedgerLines($.map(neume.components, function(nc) {
                return neume.rootSystemPos + nc.pitchDiff;
            }), nc_x, ncGlyphs[0].centre[0]*2, system);

            break;

        // CEPHALICUS
        case "cephalicus":
            var nc_x = new Array();
            // first punctum
            var punct1 = this.rendEng.getGlyph("cephalicus");
            nc_x.push(neume.zone.ulx + punct1.centre[0]);
            var glyphPunct1 = punct1.clone().set({left: nc_x[0], top: nc_y[0] - punct1.centre[1]/2});

            elements.modify.push(glyphPunct1);

            // draw left line coming off first punctum
            var lx = nc_x[0]-punct1.centre[0]+1;
            var line = this.rendEng.createLine([lx, nc_y[0], lx, neume.zone.lry], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            // draw right line coming off punctum
            var rx = glyphPunct1.left+punct1.centre[0]-2;
            line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[1]], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            // second punctum
            var punct2 = this.rendEng.getGlyph("liques_up");
            nc_x.push(nc_x[0] + punct1.centre[0] - punct2.centre[0]);
            var glyphPunct2 = punct2.clone().set({left: nc_x[1], top: nc_y[1] - punct2.centre[1]/2});

            elements.modify.push(glyphPunct2);

            // render dots
            $.each(neume.components, function(it,el) {
                if (el.hasOrnament('dot')) {
                    // get best spot for one dot
                    var bestDots = nv.bestDotPlacements(system, nc_y, it);
                    if (bestDots.length > 0) {
                        elements.modify.push(glyphDot.clone().set({left: glyphPunct2.left+(2*ncGlyphs[1].centre[0]), top: bestDots[0]}));
                    }
                }
            });

            this.drawLedgerLines($.map(neume.components, function(nc) {
                return neume.rootSystemPos + nc.pitchDiff;
            }), nc_x, ncGlyphs[0].centre[0]*2, system);

            break;

        // climacus
        case "climacus.1":
        case "climacus.2":
        case "climacus.3":
        case "climacus.4":
            var nc_x = new Array();
            // draw left punctum (will become a virga)
            nc_x.push(neume.zone.ulx + ncGlyphs[0].centre[0]);
            var virga_pad = ncGlyphs[0].centre[0];

            var glyphPunct = ncGlyphs[0].clone().set({left: nc_x[0], top: nc_y[0]});
            elements.modify.push(glyphPunct);

             // draw right line coming off punctum
            var rx = glyphPunct.left+ncGlyphs[0].centre[0]-1;
            var line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[0]+ (3/2)*system.delta_y], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            // now draw following punctum Inclinatum
            for (var i = 1; i < neume.components.length; i++) {
                nc_x.push(nc_x[i-1] + (2*ncGlyphs[i-1].centre[0])-ncOverlap_x);
                if (i == 1) {
                    nc_x[1] += virga_pad;
                }

                // draw punctum inclinatum
                var glyphdiamond = ncGlyphs[i].clone().set({left: nc_x[i], top: nc_y[i]});
                elements.modify.push(glyphdiamond);
            }

            // render dots
            $.each(neume.components, function(it,el) {
                if (el.hasOrnament('dot')) {
                    // get best spot for one dot
                    var bestDots = nv.bestDotPlacements(system, nc_y, it);
                    if (bestDots.length > 0) {
                        elements.modify.push(glyphDot.clone().set({left: nc_x[it]+(2*ncGlyphs[1].centre[0]), top: bestDots[0]}));
                    }
                }
            });

            // draw ledger lines
            this.drawLedgerLines($.map(neume.components, function(nc) {
                return neume.rootSystemPos + nc.pitchDiff;
            }), nc_x, ncGlyphs[0].centre[0]*2, system);

            break;
            
        // TORCULUS
        case "torculus":
            // derive x positions
            var nc_x = new Array();
            nc_x.push(neume.zone.ulx + ncGlyphs[0].centre[0]);
            nc_x.push(nc_x[0] + (2*ncGlyphs[0].centre[0])-ncOverlap_x);
            nc_x.push(nc_x[1] + (2*ncGlyphs[1].centre[0])-ncOverlap_x);

            // first punctum
            var glyphPunct1 = ncGlyphs[0].clone().set({left: nc_x[0], top: nc_y[0]});

            elements.modify.push(glyphPunct1);

            // draw right line coming off punctum1
            var rx = glyphPunct1.left+ncGlyphs[0].centre[0]-1;
            var line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[1]], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            // second punctum
            var glyphPunct2 = ncGlyphs[1].clone().set({left: nc_x[1], top: nc_y[1]});

            elements.modify.push(glyphPunct2);

            // draw right line coming off punctum2
            rx = glyphPunct2.left+ncGlyphs[1].centre[0]-1;
            line = this.rendEng.createLine([rx, nc_y[1], rx, nc_y[2]], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            // third punctum
            var glyphPunct3 = ncGlyphs[2].clone().set({left: nc_x[2], top: nc_y[2]});

            elements.modify.push(glyphPunct3);

            // render dots
            $.each(neume.components, function(it,el) {
                if (el.hasOrnament('dot')) {
                    // get best spot for one dot
                    var bestDots = nv.bestDotPlacements(system, nc_y, it);
                    if (bestDots.length > 0) {
                        elements.modify.push(glyphDot.clone().set({left: nc_x[it]+(2*ncGlyphs[1].centre[0]), top: bestDots[0]}));
                    }
                }
            });

            this.drawLedgerLines($.map(neume.components, function(nc) {
                return neume.rootSystemPos + nc.pitchDiff;
            }), nc_x, ncGlyphs[0].centre[0]*2, system);

            break;

        // TORCULUS RESUPINUS
        case "torculus.resupinus.1":
        case "torculus.resupinus.2":
        case "torculus.resupinus.3":
        case "torculus.resupinus.4":
            var nc_x = new Array();

            // first punctum
            nc_x.push(neume.zone.ulx + ncGlyphs[0].centre[0]);
            var glyphPunct1 = ncGlyphs[0].clone().set({left: nc_x[0], top: nc_y[0]});
            elements.modify.push(glyphPunct1);

            // now draw porrectus
            // draw swoosh
            var swoosh = this.rendEng.getGlyph("porrect_1");
            var glyphSwoosh = swoosh.clone().set({left: nc_x[0]+ncGlyphs[0].centre[0] + swoosh.centre[0] - 1, top: nc_y[1] + swoosh.centre[1]/2});
            elements.modify.push(glyphSwoosh);

            // draw left line coming off swoosh
            var lx = glyphSwoosh.left - swoosh.centre[0];
            var ly = nc_y[0];
            var swooshBot = glyphSwoosh.top + swoosh.centre[1];
            var line = this.rendEng.createLine([lx, nc_y[1], lx, ly], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            // draw punctum (it's like a porrectus if in form 1, otherwise, the punctum is drawn off to the right side)
            if (neume.typeid == "torculus.resupinus.1") {
                nc_x.push(glyphSwoosh.left + swoosh.centre[0] - ncGlyphs[3].centre[0]);    
            }
            else {
                nc_x.push(glyphSwoosh.left + swoosh.centre[0] + ncGlyphs[3].centre[0]);
            }
            var glyphPunct = ncGlyphs[3].clone().set({left: nc_x[1], top: nc_y[3]});
            elements.modify.push(glyphPunct);

            // draw right line connecting swoosh and punctum
            var rx = glyphSwoosh.left + swoosh.centre[0] - 1;
            line = this.rendEng.createLine([rx, nc_y[3], rx, nc_y[2]], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            if (neume.typeid == "torculus.resupinus.2") {
                // connect punctum trailing the porrectus
                rx = glyphPunct.left + ncGlyphs[3].centre[0] - 1;
                line = this.rendEng.createLine([rx, nc_y[4], rx, nc_y[3]], {strokeWidth: 2, interact: true});
                elements.fixed.push(line);
            }

            // draw trailing puncta
            for (var i = 4; i < neume.components.length; i++) {
                nc_x.push(nc_x[nc_x.length-1] + 2*ncGlyphs[i].centre[0] - ncOverlap_x);
                var glyphtrail = ncGlyphs[i].clone().set({left: nc_x[nc_x.length-1], top: nc_y[i]});
                elements.modify.push(glyphtrail);
            }

            // render dots
            $.each(neume.components, function(it,el) {
                if (el.hasOrnament('dot')) {
                    // get best spot for one dot
                    var bestDots = nv.bestDotPlacements(system, nc_y, it);
                    if (bestDots.length > 0) {
                        elements.modify.push(glyphDot.clone().set({left: nc_x[it]+(2*ncGlyphs[1].centre[0]), top: bestDots[0]}));
                    }
                }
            });

            // draw ledger lines
            this.drawLedgerLines($.map(neume.components, function(nc) {
                return neume.rootSystemPos + nc.pitchDiff;
            }), nc_x, ncGlyphs[0].centre[0]*2, system);

            break;

        // PODATUS
        case "podatus":
            var nc_x = new Array();
            nc_x.push(neume.zone.ulx + ncGlyphs[0].centre[0]);

            // first punctum
            var glyphPunct1 = ncGlyphs[0].clone().set({left: nc_x[0], top: nc_y[0]});
            elements.modify.push(glyphPunct1);

            // draw right line connecting two punctum
            //var rx = glyphPunct1.left + ncGlyphs[0].centre[0];
            //var line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[1]], {strokeWidth: 2, interact: true});
            //elements.fixed.push(line);

            // second punctum
            nc_x.push(nc_x[0] + 2*ncGlyphs[1].centre[0]);
            var glyphPunct2 = ncGlyphs[1].clone().set({left: nc_x[1], top: nc_y[1]});
            elements.modify.push(glyphPunct2);

            // render dots
            $.each(neume.components, function(it,el) {
                if (el.hasOrnament('dot')) {
                    // get best spot for one dot
                    var bestDots = nv.bestDotPlacements(system, nc_y, it);
                    if (bestDots.length > 0) {
                        elements.modify.push(glyphDot.clone().set({left: glyphPunct1.left+(2*ncGlyphs[1].centre[0]), top: bestDots[0]}));
                    }
                }
            });

            this.drawLedgerLines($.map(neume.components, function(nc) {
                return neume.rootSystemPos + nc.pitchDiff;
            }), nc_x, ncGlyphs[0].centre[0]*2, system);

            break;

        // EPIPHONUS
        case "epiphonus":
            var nc_x = new Array();
            // first punctum
            var punct1 = this.rendEng.getGlyph("podatus_ep");
            nc_x.push(neume.zone.ulx + punct1.centre[0]);
            var glyphPunct1 = punct1.clone().set({left: nc_x[0], top: nc_y[0]});

            elements.modify.push(glyphPunct1);

            // draw right line connecting two punctum
            var rx = glyphPunct1.left + punct1.centre[0] - 2;
            var line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[1]], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            // second punctum
            var punct2 = this.rendEng.getGlyph("liques_down");
            nc_x.push(nc_x[0] + punct1.centre[0] - punct2.centre[0]);
            var glyphPunct2 = punct2.clone().set({left: nc_x[1], top: nc_y[1] + punct2.centre[1]/2});

            elements.modify.push(glyphPunct2);

             // render dots
            $.each(neume.components, function(it,el) {
                if (el.hasOrnament('dot')) {
                    // get best spot for one dot
                    var bestDots = nv.bestDotPlacements(system, nc_y, it);
                    if (bestDots.length > 0) {
                        elements.modify.push(glyphDot.clone().set({left: glyphPunct1.left+(2*ncGlyphs[1].centre[0]), top: bestDots[0]}));
                    }
                }
            });

            this.drawLedgerLines($.map(neume.components, function(nc) {
                return neume.rootSystemPos + nc.pitchDiff;
            }), nc_x, ncGlyphs[0].centre[0]*2, system);

            break;

        // PORRECTUS
        case "porrectus":
            // draw swoosh
            var pitchDiff = neume.components[0].pitchDiff + neume.components[1].pitchDiff;
            var swoosh = null;
            switch (pitchDiff) {
                case -1:
                    swoosh = this.rendEng.getGlyph("porrect_1");
                    break;
                case -2:
                    swoosh = this.rendEng.getGlyph("porrect_2");
                    break;
                case -3:
                    swoosh = this.rendEng.getGlyph("porrect_3");
                    break;
                case -4:
                    swoosh = this.rendEng.getGlyph("porrect_4");
                    break;
                default:
                    swoosh = this.rendEng.getGlyph("porrect_4");
            }

            var glyphSwoosh = swoosh.clone().set({left: neume.zone.ulx + swoosh.centre[0], top: nc_y[0] + swoosh.centre[1]/2});
            elements.modify.push(glyphSwoosh);
            
            // draw left line coming off swoosh
            var lx = glyphSwoosh.left - swoosh.centre[0] + 1;
            var ly = neume.zone.lry;
            var swooshBot = glyphSwoosh.top + swoosh.centre[1];
            if (neume.zone.lry < glyphSwoosh.top + swooshBot) {
                ly = swooshBot;
            }
            var line = this.rendEng.createLine([lx, nc_y[0], lx, ly], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            // draw punctum
            var nc_x = glyphSwoosh.left + swoosh.centre[0] - ncGlyphs[2].centre[0];
            var glyphPunct = ncGlyphs[2].clone().set({left: nc_x, top: nc_y[2]});

            // draw right line connecting swoosh and punctum
            var rx = glyphPunct.left + ncGlyphs[2].centre[0] - 1;
            line = this.rendEng.createLine([rx, nc_y[2], rx, nc_y[1]], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            elements.modify.push(glyphPunct);

            // only check last note has a dot
            if (neume.components[2].hasOrnament('dot')) {
                // get best spot for the dot
                var bestDots = this.bestDotPlacements(system, nc_y, 2);
                if (bestDots.length > 0) {
                    elements.modify.push(glyphDot.clone().set({left: glyphPunct.left + (2*ncGlyphs[2].centre[0]), top: bestDots[0]}));
                }
            }

            // only draw ledger lines for 1st and 3rd neume components
            this.drawLedgerLines([neume.rootSystemPos + neume.components[2].pitchDiff], [nc_x], ncGlyphs[2].centre[0]*2, system);

            break;

        // PORRECTUS FLEXUS
        case "porrectus.flexus":
            // draw swoosh
            var swoosh = this.rendEng.getGlyph("porrect_1");
            var glyphSwoosh = swoosh.clone().set({left: neume.zone.ulx + swoosh.centre[0], top: nc_y[0] + swoosh.centre[1]/2});
            elements.modify.push(glyphSwoosh);

            // draw left line coming off swoosh
            var lx = glyphSwoosh.left - swoosh.centre[0] + 1;
            var ly = neume.zone.lry;
            var swooshBot = glyphSwoosh.top + swoosh.centre[1];
            if (neume.zone.lry < glyphSwoosh.top + swooshBot) {
                ly = swooshBot;
            }
            var line = this.rendEng.createLine([lx, nc_y[0], lx, ly], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            // draw punctum to the right
            var nc_x = new Array();
            nc_x.push(glyphSwoosh.left + swoosh.centre[0] + ncGlyphs[2].centre[0]);
            var glyphPunct = ncGlyphs[2].clone().set({left: nc_x[0], top: nc_y[2]});

            // draw right line connecting swoosh and punctum
            var rx = nc_x[0] - ncGlyphs[2].centre[0] - 1;
            line = this.rendEng.createLine([rx, nc_y[2], rx, nc_y[1]], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            elements.modify.push(glyphPunct);

            // draw trailing punctum
            for (var i = 3; i < neume.components.length; i++) {
                nc_x.push(nc_x[nc_x.length-1] + 2*ncGlyphs[i].centre[0] - ncOverlap_x);
                var glyphtrail = ncGlyphs[i].clone().set({left: nc_x[nc_x.length-1], top: nc_y[i]});
                elements.modify.push(glyphtrail);
            }

            // render dots for everything after the swoosh
            for(var i = 2; i < neume.components.length; i++) {
                var el = neume.components[i];
                if (el.hasOrnament('dot')) {
                    // get best spot for one dot
                    var bestDots = nv.bestDotPlacements(system, nc_y, it);
                    if (bestDots.length > 0) {
                        elements.modify.push(glyphDot.clone().set({left: glyphPunct1.left+(2*ncGlyphs[1].centre[0]), top: bestDots[0]}));
                    }
                }
            };

            break;

        // SCANDICUS
        case "scandicus.1":
        case "scandicus.2":
        case "scandicus.3":
        case "scandicus.4":
            // cache number of neume components
            var numNC = neume.components.length;
            var lastX = neume.zone.ulx - ncGlyphs[0].centre[0];

            var nc_x = new Array();
            
            // draw podatuses
            for (var i = 0; i < numNC-1; i+=2) {
                // if punctums are right on top of each other, spread them out a bit
                yoffset = 0;
                if (Math.abs(neume.components[i+1].pitchDiff - neume.components[i].pitchDiff) == 1) {
                    yoffset = 1
                }

                // pes
                lastX += 2*ncGlyphs[i].centre[0] - ncOverlap_x;
                nc_x.push(lastX);
                var glyphPes = ncGlyphs[i].clone().set({left: nc_x[i], top: nc_y[i] - ncGlyphs[i].centre[1]/2 + yoffset});
                elements.modify.push(glyphPes);

                // draw right line connecting two punctum
                //var rx1 = lastX + ncGlyphs[i].centre[0] - 1;
                //var line1 = this.rendEng.createLine([rx1, nc_y[i], rx1, nc_y[i+1]], {strokeWidth: 2, interact: true});
                //elements.fixed.push(line1);

                // second punctum
                nc_x.push(nc_x[i] + 2*ncGlyphs[i+1].centre[0]);
                var glyphPunct2 = ncGlyphs[i+1].clone().set({left: nc_x[i+1], top: nc_y[i+1] - yoffset});
                elements.modify.push(glyphPunct2);

                // render dots
                for (var ncInd = i; ncInd < i+2; ncInd++) {
                    if (neume.components[ncInd].hasOrnament('dot')) {
                        //get best spot for the dot
                        var bestDots = this.bestDotPlacements(system, nc_y, ncInd);
                        if (bestDots.length > 0) {
                            elements.modify.push(glyphDot.clone().set({left: glyphPunct2.left+(2*ncGlyphs[ncInd].centre[0]), top: bestDots[0]}));
                        }
                    }
                }
            }

            if (neume.components.length % 2 == 1) {
                // draw virga
                lastX += 2*ncGlyphs[numNC-1].centre[0] - ncOverlap_x;
                nc_x.push(lastX);
                var glyphPunct3 = ncGlyphs[numNC-1].clone().set({left: lastX, top: nc_y[numNC-1]});
                elements.modify.push(glyphPunct3);

                // draw dots on stray virga if they exist
                if(neume.components[numNC-1].hasOrnament('dot')) {
                    // get best spot for the dot
                    var bestDots = this.bestDotPlacements(system, nc_y, numNC-1);
                    if (bestDots.length > 0) {
                        elements.modify.push(glyphDot.clone().set({left: glyphPunct3.left + (2*ncGlyphs[numNC-1].centre[0]), top: bestDots[0]}));
                    }
                }

                // draw right line coming off punctum
                //var rx2 = lastX + ncGlyphs[numNC-1].centre[0] - 2;
                //var line2 = this.rendEng.createLine([rx2, nc_y[numNC-1], rx2, neume.zone.lry - ((neume.zone.lry - neume.zone.uly)/2)], 
                //                                    {strokeWidth: 2, interact: true});
                //elements.fixed.push(line2);
            }

            this.drawLedgerLines($.map(neume.components, function(nc) {
                return neume.rootSystemPos + nc.pitchDiff;
            }), nc_x, ncGlyphs[0].centre[0]*2, system);

            break;
        
        case "scandicus.flexus.1":
            // cache number of neume components
            var nc_x = new Array();
            nc_x.push(neume.zone.ulx + ncGlyphs[0].centre[0]);

            // first punctum
            var glyphPunct1 = ncGlyphs[0].clone().set({left: nc_x[0], top: nc_y[0]});
            elements.modify.push(glyphPunct1);

            // draw right line connecting two punctum
            var rx = glyphPunct1.left + ncGlyphs[0].centre[0];
            var line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[1]], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            // second punctum
            nc_x.push(nc_x[0] + 2*ncGlyphs[1].centre[0]);
            var glyphPunct2 = ncGlyphs[1].clone().set({left: nc_x[1], top: nc_y[1]});
            elements.modify.push(glyphPunct2);

            // render dots for the podatus part of the neume
            for (var ncInd = 0; ncInd < 2; ncInd++) {
                if (neume.components[ncInd].hasOrnament('dot')) {
                    //get best spot for the dot
                    var bestDots = this.bestDotPlacements(system, nc_y, ncInd);
                    if (bestDots.length > 0) {
                        elements.modify.push(glyphDot.clone().set({left: nc_x[ncInd]+(2*ncGlyphs[ncInd].centre[0]), top: bestDots[0]}));
                    }
                }
            }

            // now draw the clivis
            // first punctum
            nc_x.push(nc_x[1] + 2*ncGlyphs[2].centre[0]);
            var glyphClivis1 = ncGlyphs[2].clone().set({left: nc_x[2], top: nc_y[2]});
            elements.modify.push(glyphClivis1);

            // draw right line coming off punctum
            var rx = nc_x[2]+ncGlyphs[2].centre[0] - 1;
            line = this.rendEng.createLine([rx, nc_y[2], rx, nc_y[3]], {strokeWidth: 2, interact: true});
            elements.fixed.push(line);

            // second punctum
            nc_x.push(nc_x[2] + (2*ncGlyphs[3].centre[0]));
            var glyphClivis2 = ncGlyphs[3].clone().set({left: nc_x[3], top: nc_y[3]});

            elements.modify.push(glyphClivis2);

            // render dots
            for (var ncInd = 2; ncInd < neume.components.length; ncInd++) {
                if (neume.components[ncInd].hasOrnament('dot')) {
                    // get best spot for one dot
                    var bestDots = nv.bestDotPlacements(system, nc_y, it);
                    if (bestDots.length > 0) {
                        elements.modify.push(glyphDot.clone().set({left: glyphPunct2.left+(2*ncGlyphs[1].centre[0]), top: bestDots[0]}));
                    }
                }
            };

            this.drawLedgerLines($.map(neume.components, function(nc) {
                return neume.rootSystemPos + nc.pitchDiff;
            }), nc_x, ncGlyphs[0].centre[0]*2, system);

            break;
        case "scandicus.flexus.2":
            break;
        case "scandicus.flexus.3":
            break;

    }
    
    this.drawing = this.rendEng.draw(elements, {group: true, selectable: neume.props.interact, eleRef: neume})[0];

    // update model
    $(neume).trigger("mUpdateBoundingBox", this.drawing);
}
