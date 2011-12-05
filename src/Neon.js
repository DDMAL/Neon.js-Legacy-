/*
Copyright (C) 2011 by Gregory Burlet

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

// this pattern was taken from http://www.virgentech.com/blog/2009/10/building-object-oriented-jquery-plugin.html
(function($) {
    var Neon = function(element, options)
    {
        var elem = $(element);
        var f_canvas;
        var glyphs;

        // These are variables which can be overridden upon instantiation
        var defaults = {
            width: 1000,
            height: 1000,
            autoLoad: false,
            filename: ""
        };

        var settings = $.extend({}, defaults, options);

        // These are variables which can not be overridden by the user
        var globals = {
            canvasid: "neon-canvas"
        };

        $.extend(settings, globals);

        /******************************
         *      PUBLIC FUNCTIONS      *
         ******************************/
        this.importFile = function()
        {
            console.log('importing MEI in JSON format ...');
        };

        this.exportFile = function()
        {
            console.log("exporting JSON ...");
        }


        /******************************
         *      PRIVATE FUNCTIONS     *
         ******************************/
        var loadGlyphs = function() {
            console.log("loading svg glyphs ...");
            glyphs = new Object();
            
            $.get("/static/img/neumes_concat.svg", function(svg) {
                // for each glyph, load it into fabric
                $(svg).find("svg").each(function(it, el) {
                    // http://stackoverflow.com/questions/652763/jquery-object-to-string
                    var rawSVG = $("<lol>").append($(el).clone()).remove().html();
                    fabric.loadSVGFromString(rawSVG, function(objects) {
                        glyphs[$(el).find("path").attr("id")] = objects[0].scale(0.5);
                    });
                });
            });
        };

        var loadPage = function(fileName) {
            $.get("/"+fileName+"/mei", function(data) {
                console.debug(data);
            });
        };

        var init = function() {
            // add canvas element to the element tied to the jQuery plugin
            var canvas = $("<canvas>").attr("id", settings.canvasid);

            // TODO: getPageWidth and getPageHeight parse from JSONified MEI file
            canvas.attr("width", settings.width);
            canvas.attr("height", settings.height);

            elem.prepend(canvas);

            f_canvas = new fabric.Canvas(settings.canvasid);

            // load neume glyphs from svg file
            loadGlyphs();
            
            // load MEI file from server
            if (settings.autoLoad) {
                loadPage(settings.filename);
            }
        };

        // Call the init function when this object is created.
        init();

        // handler for when ajax calls have been completed
        var loaded = function() {
            console.log("Load successful. Neon.js ready.");
        }

        elem.ajaxStop(loaded);
    };

    $.fn.neon = function(options)
    {
        return this.each(function()
        {
            var element = $(this);

            // Return early if this element already has a plugin instance
            if (element.data('neon'))
            {
                return;
            }

            // pass options to plugin constructor
            var neon = new Neon(this, options);

            // Store plugin object in this element's data
            element.data('neon', neon);
        });
    };
})(jQuery);

