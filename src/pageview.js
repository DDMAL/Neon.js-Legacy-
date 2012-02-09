Toe.View.PageView = function(renderEngine) {
    this.rendEng = renderEngine; 
}

Toe.View.PageView.prototype.constructor = Toe.View.PageView;

Toe.View.PageView.prototype.setDimensions = function(width, height) {
    this.canvas.setDimensions({width: width, height: height});
}
