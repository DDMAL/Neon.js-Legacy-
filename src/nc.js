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
Toe.Model.NeumeComponent = function(diff, rendEng, options) {
    this.diff = diff;
    this.rendEng = rendEng;

    this.props = {
        type: "punctum",
        ornament: null,
        interact: true
    };

    $.extend(this.props, options);

    // check valid type
    this.props.type.toLowerCase();
    this.props.type = Toe.Model.NeumeComponent.Type[this.props.type];
    if (this.props.type == undefined) {
        throw new Error("NeumeComponent: undefined neume component type");
    }
}

Toe.Model.NeumeComponent.prototype.constructor = Toe.Model.NeumeComponent;

Toe.Model.NeumeComponent.Type = {
    punctum: {
        name: "Punctum",
        svgkey: "punctum"
    },
    whitepunct: {
        name: "White Punctum",
        svgkey: "whitepunct"
    },
    inclinatum: {
        name: "Punctum Inclinatum",
        svgkey: "diamond"
    },
    smallinclinatum: {
        name: "Punctum Inclinatum Parvum",
        svgkey: "smalldiamond"
    },
    quilisma: {
        name: "Quilisma",
        svgkey: "quilisma"
    }
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

Toe.Model.NeumeComponent.prototype.render = function() {
    if (!this.rendEng) {
        throw new Error("Clef: Invalid render context");
    }
}
