Toe.View.StaffView = function(renderEngine) {
    this.rendEng = renderEngine;
}

Toe.View.StaffView.prototype.constructor = Toe.View.StaffView;

Toe.View.StaffView.prototype.renderStaff = function(staff) {
    if (!this.rendEng) {
        throw new Error("Staff: Invalid render context");
    }

    var elements = new Array();
    
    // render staff lines
    for (var li = 0; li < staff.props.numLines; li++) {
        var yval = staff.zone.uly+(li*staff.delta_y);
        elements.push(this.rendEng.createLine([staff.zone.ulx, yval, staff.zone.lrx, yval], {interact: staff.props.interact}));
    }
    
	this.rendEng.draw(elements, {modify: false});
}
