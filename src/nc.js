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
 * @requires Toe
 * @class Neume Component
 */
Toe.Model.NeumeComponent = function(diff, options) {
    this.diff = diff;

    this.props = {
        type: "punctum",
        ornament: null,
        interact: true
    };

    $.extend(this.props, options);

    // check valid type
    this.props.type = this.props.type.toLowerCase();
    this.props.name = Toe.Model.NeumeComponent.Type[this.props.type];
    if (this.props.name == undefined) {
        throw new Error("NeumeComponent: undefined neume component");
    }
}

Toe.Model.NeumeComponent.prototype.constructor = Toe.Model.NeumeComponent;

Toe.Model.NeumeComponent.Type = {
    punctum: "Punctum",
    whitepunct: "White Punctum",
    inclinatum: "Punctum Inclinatum",
    smallinclinatum: "Punctum Inclinatum Parvum",
    quilisma: "Quilisma"
};

Toe.Model.NeumeComponent.Ornament = {
    EPISEMA: {
        name: "Episema",
        form: null
    },
    DOT: {
        name: "Dot",
        form: null
    }
};

Toe.Model.NeumeComponent.prototype.setPosition = function(pos) {
    this.x = pos[0];
    this.y = pos[1];
}
