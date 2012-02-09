Toe.Ctrl.NeumeController = function(nModel, nView) {
    /**
     * Listen to the view
     */

    /**
     * Listen to the model
     */
    $(nModel).bind("vRenderNeume", function(event, neume, staff) {
        nView.renderNeume(neume, staff);
    });
}

Toe.Ctrl.NeumeController.prototype.constructor = Toe.Ctrl.NeumeController;

