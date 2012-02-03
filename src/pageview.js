Toe.View.PageView = function(renderEngine) {
    this.rendEng = renderEngine; 
}

Toe.View.PageView.prototype.constructor = Toe.View.PageView;

Toe.View.PageView.prototype.setDimensions = function(width, height) {
    this.canvas.setDimensions({width: width, height: height});
}

Toe.View.PageView.prototype.renderStaff = function(staff) {
    if (!this.rendEng) {
        throw new Error("Staff: Invalid render context");
    }

    var elements = new Array();
    
    // render staff lines
    for (var li = 0; li < staff.props.numLines; li++) {
        var yval = staff.zone.uly+(li*staff.delta_y);
        elements.push(staff.rendEng.createLine([staff.zone.ulx, yval, staff.zone.lrx, yval], {interact: staff.props.interact}));
    }
    
	this.rendEng.draw(elements, {modify: false});
}
