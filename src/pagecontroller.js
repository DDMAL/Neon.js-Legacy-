// Singleton class
Toe.Ctrl.PageController = function(pModel, pView) {
    /**
     * Listen to the view
     */
    $(pView).bind("mSetDimensions.ui", function(event, width, height) {
        pModel.setDimensions(width, height);
    });

    /**
     * Listen to the model
     */
    $(pModel).bind("vSetDimensions", function(event, width, height) {
        pView.setDimensions(width, height);
    });
}

Toe.Ctrl.PageController.prototype.constructor = Toe.Ctrl.PageController;
