Toe.Ctrl.ClefController = function(cModel, cView) {
    /**
     * Listen to the view
     */

    /**
     * Listen to the model
     */
    $(cModel).bind("vRenderClef", function(event, clef) {
        cView.renderClef(clef);
    });

}

Toe.Ctrl.ClefController.prototype.constructor = Toe.Ctrl.ClefController;
