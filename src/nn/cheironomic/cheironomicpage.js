/*
Copyright (C) 2011 by Gregory Burlet, Alastair Porter

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
 * A St. Gallen music score. 
 *
 * @class Represents a page of music from the St. Gallen manuscript
 * @extends Toe.Model.Page
 */
Toe.Model.StGallenPage = function() {
}

// inherit prototype from page object
Toe.Model.StGallenPage.prototype = new Toe.Model.Page();

Toe.Model.StGallenPage.prototype.constructor = Toe.StGallenPage;

/**
 * Loads the page of music from an MEI file.
 *
 * @methodOf Toe.Model.StGallenPage
 */
Toe.Model.StGallenPage.prototype.loadMei = function(mei) {
    // cache page reference
    var page = this;
};
