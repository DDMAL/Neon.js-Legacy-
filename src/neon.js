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
        var loadNum = 0;

        // These are variables which can be overridden upon instantiation
        var defaults = {
            width: 800,
            height: 600,
            autoLoad: false,
            filename: "",
            backgroundImage: ""
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
                if (settings.filename) {
                    // load MEI file from server
                    loadPage(settings.filename, page);
                }
                if (settings.backgroundImage) {
                    // load background image and get canvas dimensions from it
                    handleBackgroundImage(settings.backgroundImage);
                }
            }
        };

        // helper function
        var parseBoundingBox = function(zoneFacs) {
            var ulx = parseInt($(zoneFacs).attr("ulx"));
            var uly = parseInt($(zoneFacs).attr("uly"));
            var lrx = parseInt($(zoneFacs).attr("lrx"));
            var lry = parseInt($(zoneFacs).attr("lry"));
            
            return [ulx, uly, lrx, lry];
        };

        var loadMeiPage = function(displayZones) {
            // for each system
            $(mei).find("sb").each(function(sit, sel) {
                // get facs data
                var sbref = $(sel).attr("systemref");
                var sysfacsid = $($(mei).find("system[xml\\:id=" + sbref + "]")[0]).attr("facs");
                var sysFacs = $(mei).find("zone[xml\\:id=" + sysfacsid + "]")[0];
                
                // create staff
                var s_bb = parseBoundingBox(sysFacs);
                if (displayZones) {
                    rendEng.outlineBoundingBox(s_bb, {fill: "blue"});
                }
                var s = new Toe.Staff(s_bb, rendEng);

                // set global scale using staff from first system
                if(sit == 0) {
                    rendEng.calcScaleFromStaff(s, {overwrite: true});
                }

                // set clef
                var clef = $(this).nextUntil("sb", "clef");
                var clefShape = $(clef).attr("shape");
                var clefLine = parseInt($(clef).attr("line"));
            
                var clefFacsId = $(clef).attr("facs");
                var clefFacs = $(mei).find("zone[xml\\:id=" + clefFacsId + "]")[0];
                var c_bb = parseBoundingBox(clefFacs);
                if (displayZones) {
                    rendEng.outlineBoundingBox(c_bb, {fill: "red"});
                }

                s.setClef(clefShape, clefLine, {zone: c_bb});

                page.addStaves(s);

                // load all neumes in section
                $(this).nextUntil("sb", "neume").each(function(nit, nel) {
                    var neume = new Toe.Neume(rendEng);
                    var neumeFacs = $(mei).find("zone[xml\\:id=" + $(nel).attr("facs") + "]")[0];
                    var n_bb = parseBoundingBox(neumeFacs);
                    if (displayZones) {
                        rendEng.outlineBoundingBox(n_bb, {fill: "green"});
                    }

                    neume.neumeFromMei(nel, $(neumeFacs));
                    console.log("neume type: " + neume.deriveName());
                    s.addNeumes(neume);
                });
            });

            page.render();
        };

        var loadGlyphs = function(rendEng) {
            console.log("loading SVG glyphs ...");
            
            $.get(settings.prefix+"/static/img/neumes_concat.svg", function(svg) {
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

        var handleBackgroundImage = function(filename) {
            fabric.Image.fromURL(settings.prefix+"/"+filename+"/file", function(img) {
                if (img.width > settings.width) {
                    settings.width = img.width;
                }
                if (img.height > settings.height) {
                    settings.height = img.height;
                }

                loadNum++;
                console.log("ESCAPE");
            });
        };

        var loadPage = function(fileName, page) {
            var dims;
            $.get(settings.prefix+"/"+fileName+"/file", function(data) {
                console.log("loading MEI file ...");

                // save mei data
                mei = data;
            });
            return dims;
        };

        // handler for when ajax calls have been completed
        var loaded = function() {
            // wait for other asynchronous loads
            var clincher = 0;
            while (clincher < 3000 && loadNum < 1) {
                console.log("WAITING!"); 
                clincher++;
            }

            // add canvas element to the element tied to the jQuery plugin
            var canvas = $("<canvas>").attr("id", settings.canvasid);

            var canvasDims = [settings.width, settings.height];
            if (settings.autoLoad) {
                // derive canvas dimensions from mei facs
                canvasDims = page.calcDimensions($(mei).find("zone"));
                console.log("mei dimensions: width = " + canvasDims[0] + ", height = " + canvasDims[1]);
                
                if (canvasDims[0] < settings.width) {
                    canvasDims[0] = settings.width;
                }
                if (canvasDims[1] < settings.height) {
                    canvasDims[1] = settings.height;
                }
            }
            console.log("setting canvas dimensions: width = " + canvasDims[0] + ", height = " + canvasDims[1]);
            page.setDimensions(canvasDims[0], canvasDims[1]);

            // make canvas dimensions the size of the page
            canvas.attr("width", page.width);
            canvas.attr("height", page.height);
            canvas.attr("style", "border: 4px black solid;");

            elem.prepend(canvas);

            rendEng.setCanvas(new fabric.Canvas(settings.canvasid, {backgroundImage: settings.prefix+"/"+settings.backgroundImage+"/file"}));
            
            if (settings.autoLoad && mei) {
                loadMeiPage(true, true);
            }

            console.log("Load successful. Neon.js ready.");
        };
        
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
