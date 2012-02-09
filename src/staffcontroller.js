Toe.Ctrl.StaffController = function(sModel, sView) {
    /**
     * Listen to the view
     */

    /**
     * Listen to the model
     */
    $(sModel).bind("vRenderStaff", function(event, staff) {
        sView.renderStaff(staff);
    });
}

Toe.Ctrl.StaffController.prototype.constructor = Toe.Ctrl.StaffController;
