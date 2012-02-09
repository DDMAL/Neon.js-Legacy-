Toe.Ctrl.NeumeController = function(nModel, nView) {
    /**
     * Listen to the view
     */

    /**
     * Listen to the model
     */
    $(nModel).bind("vRenderNeume", function(event, neume, staff) {
        var rootDiff = neume.getRootDifference(staff);
        var clef_y = staff.clef.y;

        // derive positions of neume components
        var nc_y = new Array();

        // set root note y pos
        nc_y.push(clef_y + ((~rootDiff + 1) * staff.delta_y / 2));
        for (var i = 1; i < neume.components.length; i++) {
            nc_y.push(nc_y[0] + ((~neume.components[i].diff + 1) * staff.delta_y/2));
        }

        nView.renderNeume(neume, nc_y);
    });
}

Toe.Ctrl.NeumeController.prototype.constructor = Toe.Ctrl.NeumeController;

