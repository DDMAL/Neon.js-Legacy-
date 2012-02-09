Toe.View.NeumeView = function(renderEngine) {
    this.rendEng = renderEngine;
}

Toe.View.NeumeView.prototype.constructor = Toe.View.NeumeView;

Toe.View.NeumeView.prototype.renderNeume = function(neume, staff) {
    if (!this.rendEng) {
        throw new Error("Neume: Invalid render context");
    }

    if (!neume.props.type) {
        neume.deriveName();
    }

    var ncOverlap_x = 1; // (pixels)

    var rootDiff = neume.getRootDifference(staff);
    var clef_y = staff.clef.y;

    // derive positions of neume components
    var nc_y = new Array();
    // set root note y pos
    nc_y.push(clef_y + ((~rootDiff + 1) * staff.delta_y / 2));
    for (var i = 1; i < neume.components.length; i++) {
        nc_y.push(nc_y[0] + ((~neume.components[i].diff + 1) * staff.delta_y/2));
    }

    var elements = new Array();

    switch (neume.props.type) {
        // PUNCTUM
        case Toe.Model.Neume.Type.punctum:
            // look into neume component for more drawing details
            var punct = this.rendEng.getGlyph(neume.components[0].props.type.svgkey);
            var glyphPunct = punct.clone().set({left: neume.zone.ulx + punct.centre[0], top: nc_y[0]});

            elements.push(glyphPunct);
            break;

        // VIRGA
        case Toe.Model.Neume.Type.virga:
            var punct = this.rendEng.getGlyph("punctum");
            var glyphPunct = punct.clone().set({left: neume.zone.ulx + punct.centre[0], top: nc_y[0]});

            elements.push(glyphPunct);

            // draw right line coming off punctum
            var rx = glyphPunct.left+punct.centre[0]-1;
            var line = this.rendEng.createLine([rx, nc_y[0], rx, neume.zone.lry], {strokeWidth: 2, interact: true});
            this.rendEng.draw([line], {modify: false});
            break;

        // CLIVIS
        case Toe.Model.Neume.Type.clivis:
            // first punctum
            var punct = this.rendEng.getGlyph("punctum");
            var glyphPunct1 = punct.clone().set({left: neume.zone.ulx + punct.centre[0], top: nc_y[0]});

            elements.push(glyphPunct1);

            // draw left line coming off first punctum
            var lx = glyphPunct1.left-punct.centre[0]+1;
            var line = this.rendEng.createLine([lx, nc_y[0], lx, neume.zone.lry], {strokeWidth: 2, interact: true});
            this.rendEng.draw([line], {modify: false});

            // draw right line coming off punctum
            var rx = glyphPunct1.left+punct.centre[0];
            var line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[1]], {strokeWidth: 2, interact: true});
            this.rendEng.draw([line], {modify: false});

            // second punctum
            var glyphPunct2 = punct.clone().set({left: glyphPunct1.left+(2*punct.centre[0]), top: nc_y[1]});

            elements.push(glyphPunct2);
            break;

        // TORCULUS
        case Toe.Model.Neume.Type.torculus:
            // first punctum
            var punct = this.rendEng.getGlyph("punctum");
            var glyphPunct1 = punct.clone().set({left: neume.zone.ulx + punct.centre[0], top: nc_y[0]});

            elements.push(glyphPunct1);

            // draw right line coming off punctum1
            var rx = glyphPunct1.left+punct.centre[0]-1;
            var line = this.rendEng.createLine([rx, nc_y[0], rx, nc_y[1]], {strokeWidth: 2, interact: true});
            this.rendEng.draw([line], {modify: false});

            // second punctum
            var glyphPunct2 = punct.clone().set({left: glyphPunct1.left+(2*punct.centre[0])-ncOverlap_x, top: nc_y[1]});

            elements.push(glyphPunct2);

            // draw right line coming off punctum2
            var rx = glyphPunct2.left+punct.centre[0]-1;
            var line = this.rendEng.createLine([rx, nc_y[1], rx, nc_y[2]], {strokeWidth: 2, interact: true});
            this.rendEng.draw([line], {modify: false});

            // third punctum
            var glyphPunct3 = punct.clone().set({left: glyphPunct2.left+(2*punct.centre[0])-ncOverlap_x, top: nc_y[2]});

            elements.push(glyphPunct3);
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
            var punct = this.rendEng.getGlyph("punctum");
            var glyphPunct2 = punct.clone().set({left: glyphPunct1.left, top: nc_y[1]});

            elements.push(glyphPunct2);
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
            var punct = this.rendEng.getGlyph("punctum");
            var glyphPunct = punct.clone().set({left: glyphSwoosh.left + swoosh.centre[0] - punct.centre[0], top: nc_y[2]});

            // draw right line connecting swoosh and punctum
            var rx = glyphPunct.left + punct.centre[0] - 1;
            var line = this.rendEng.createLine([rx, nc_y[2], rx, nc_y[1]], {strokeWidth: 2, interact: true});
            this.rendEng.draw([line], {modify: false});

            elements.push(glyphPunct);
            break;

        // SCANDICUS
        case Toe.Model.Neume.Type.scandicus:
            var pes = this.rendEng.getGlyph("pes");
            var punct = this.rendEng.getGlyph("punctum");
            var lastX = neume.zone.ulx - punct.centre[0];

            // draw podatuses
            for (var i = 0; i < neume.components.length-1; i+=2) {
                // if punctums are right on top of each other, spread them out a bit
                if (Math.abs(neume.components[i+1].diff - neume.components[i].diff) == 1) {
                    nc_y[i] += 1;
                    nc_y[i+1] -= 1;
                }

                // pes
                lastX += 2*punct.centre[0] - ncOverlap_x;
                var glyphPes = pes.clone().set({left: lastX, top: nc_y[i] - pes.centre[1]/2});
                elements.push(glyphPes);

                // draw right line connecting two punctum
                var rx1 = lastX + pes.centre[0] - 1;
                var line1 = this.rendEng.createLine([rx1, nc_y[i], rx1, nc_y[i+1]], {strokeWidth: 2, interact: true});
                this.rendEng.draw([line1], {modify: false});

                // second punctum
                var glyphPunct2 = punct.clone().set({left: lastX, top: nc_y[i+1]});
                elements.push(glyphPunct2);
            }

            if (neume.components.length % 2 == 1) {
                // draw virga
                lastX += 2*punct.centre[0] - ncOverlap_x;
                var glyphPunct3 = punct.clone().set({left: lastX, top: nc_y[neume.components.length-1]});
                elements.push(glyphPunct3);

                // draw right line coming off punctum
                var rx2 = lastX + punct.centre[0] - 2;
                var line2 = this.rendEng.createLine([rx2, nc_y[neume.components.length-1], rx2, neume.zone.lry - ((neume.zone.lry - neume.zone.uly)/2)], 
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
