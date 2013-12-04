/*
Copyright (C) 2011-2013 by Gregory Burlet, Alastair Porter

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * Generic interaction view.
 */
Toe.View.Interaction = function(rendEng, page, apiprefix, guiToggles) {
};

Toe.View.Interaction.prototype.constructor = Toe.View.Interaction;


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GUI Management Methods
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
Toe.View.Interaction.prototype.showInfo = function(aText) {
    $("#info > p").html(aText);
    $("#info").animate({opacity: 1.0}, 100);
};

Toe.View.Interaction.prototype.hideInfo = function() {
    $("#info").animate({opacity: 0.0}, 100);
};

Toe.View.Interaction.prototype.showAlert = function(aText) {
    $("#alert > p").text(aText);
    $("#alert").animate({opacity: 1.0}, 100);
};