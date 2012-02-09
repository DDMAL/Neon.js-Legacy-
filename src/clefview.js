Toe.View.ClefView = function(renderEngine) {
    this.rendEng = renderEngine;
}

Toe.View.ClefView.prototype.constructor = Toe.View.ClefView;

Toe.View.ClefView.prototype.renderClef = function(clef) {
    if (!this.rendEng) {
        throw new Error("Clef: Invalid render context");
    }
    
    var svgKey = null;
    switch(clef.shape) {
        case "c":
            svgKey = "c_clef";
            break;
        case "f":
            svgKey = "f_clef";
            break;
    }

    var cGlyph = this.rendEng.getGlyph(svgKey);
    var svgClef = cGlyph.clone().set({left: clef.x + cGlyph.centre[0], top: clef.y}); // offset centre
    svgClef.selectable = clef.props.interact;

    this.rendEng.draw([svgClef]);
}
