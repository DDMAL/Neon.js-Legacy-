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

// this pattern was taken from http://www.virgentech.com/blog/2009/10/building-object-oriented-jquery-plugin.html
(function($) {
    var Neon = function(element, options)
    {
        var elem = $(element);
        var page;
        var mei;
        var rendEng;

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
        // placeholder

        /******************************
         *      PRIVATE FUNCTIONS     *
         ******************************/
        var init = function() {
            // initialize rendering engine
            rendEng = new Toe.RenderEngine();

            // load neume glyphs from svg file
            loadGlyphs(rendEng);
            
            // create page
            page = new Toe.Page();
            if (settings.autoLoad) {
                // load MEI file from server
                loadPage(settings.filename, page);
            }
            else {
                page.setDimensions(settings.width, settings.height);
            }
        };

        var loadGlyphs = function(rendEng) {
            console.log("loading SVG glyphs ...");
            
            $.get("/static/img/neumes_concat.svg", function(svg) {
                var glyphs = new Object();

                // for each glyph, load it into fabric
                $(svg).find("svg").each(function(it, el) {
                    // http://stackoverflow.com/questions/652763/jquery-object-to-string
                    var rawSVG = $("<lol>").append($(el).clone()).remove().html();
                    fabric.loadSVGFromString(rawSVG, function(objects) {
                        gID = $(el).find("path").attr("id");
                        glyphs[gID] = new Toe.Glyph(gID, objects[0]);
                    });
                });
                rendEng.setGlyphs(glyphs);
            });
        };

        var loadPage = function(fileName, page) {
            $.get("/"+fileName+"/mei", function(data) {
                console.log("loading MEI file ...");

                // set page dimensions
                page.calcDimensions($(data).find("zone"));

                // save mei data
                mei = data;
            });
        };

        // handler for when ajax calls have been completed
        var loaded = function() {
            // add canvas element to the element tied to the jQuery plugin
            var canvas = $("<canvas>").attr("id", settings.canvasid);

            // sanity check
            if (!page.width || !page.height) {
                throw new Error("Page dimensions have not been set.");
            }

            // make canvas dimensions the size of the page 
            canvas.attr("width", page.width);
            canvas.attr("height", page.height);

            elem.prepend(canvas);

            rendEng.setCanvas(new fabric.Canvas(settings.canvasid));

            // set global scale
            var sb1ref = $($(mei).find("sb")[0]).attr("systemref");
            var sys1facsid = $($(mei).find("system[xml\\:id=" + sb1ref + "]")[0]).attr("facs");
            var sysFacs = $(mei).find("zone[xml\\:id=" + sys1facsid + "]")[0];
            rendEng.calcScaleFromStaff(sysFacs, {overwrite: true});

            // first system
            var s1 = new Toe.Staff([190, 302, 1450, 406], rendEng);
            s1.setClef("c", 4);

            /* test
            var n1 = new Toe.Neume(rendEng);
            var ndata = $(mei).find("neume")[0];
            n1.neumeFromMei(ndata, $(mei).find("zone[xml\\:id=" + $(ndata).attr("facs") + "]")[0]);
            */
            
            // second system
            // <zone lry="635" lrx="1447" xml:id="m-148e5db0-8f9b-49de-ba1b-9fdec93ec173" uly="534" ulx="22"/>
            var s2 = new Toe.Staff([22, 534, 1447, 635], rendEng);
            s2.setClef("c", 4);

            page.addStaves(s1, s2).render();
            
            console.log("Load successful. Neon.js ready.");
        }
        
        // Call the init function when this object is created.
        init();

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
