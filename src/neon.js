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
        var startTime;

        // These are variables which can be overridden upon instantiation
        var defaults = {
            width: 800,
            height: 600,
            autoLoad: false,
            filename: "",
            backgroundImage: "",
            backgroundOpacity: 0.60
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
            // start time
            startTime = new Date();
            
            // initialize rendering engine
            rendEng = new Toe.RenderEngine();
            
            // create page
            page = new Toe.Page();

            /*
             * Start asynchronous function calls
             * Get promises and wait for queued functions to finish
             * 1) load neume glyphs from svg file
             * 2) load MEI file from server
             * 3) load background image and get canvas dimensions from it
             * on success (all done): continue processing
             * on failure, print error message
             */
            $.when(loadGlyphs(rendEng),
                   loadPage(settings.filename),
                   handleBackgroundImage(settings.backgroundImage)
            ).then(loadSuccess, 
                   function() { 
                       console.log("Failure to load the mei file, glyphs, or background image");
                   }
            );
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

        // asynchronous function
        var loadGlyphs = function(rendEng) {
            console.log("loading SVG glyphs ...");
            
            // return deferred promise
            return $.get(settings.prefix+"/static/img/neumes_concat.svg", function(svg) {
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

        // asynchronous function
        var handleBackgroundImage = function(filename) {
            console.log("loading background image ...");
            var dfd = $.Deferred();

            if (settings.autoLoad && settings.backgroundImage) {
                fabric.Image.fromURL(settings.prefix+"/"+filename+"/file", function(img) {
                    if (img.width > settings.width) {
                        settings.width = img.width;
                    }
                    if (img.height > settings.height) {
                        settings.height = img.height;
                    }

                    dfd.resolve();
                });
            }
            else {
                // immediately resolve
                dfd.resolve();
            }

            // return promise
            return dfd.promise();
        };

        // asynchronous function
        var loadPage = function(fileName) {
            var dfd = $.Deferred();
            
            if (settings.autoLoad && settings.filename) {
                $.get(settings.prefix+"/"+fileName+"/file", function(data) {
                    console.log("loading MEI file ...");

                    // save mei data
                    mei = data;

                    dfd.resolve();
                });
            }
            else {
                // immediately resolve
                dfd.resolve();
            }

            // return promise
            return dfd.promise();
        };

        // handler for when asynchronous calls have been completed
        var loadSuccess = function() {
            // add canvas element to the element tied to the jQuery plugin
            var canvas = $("<canvas>").attr("id", settings.canvasid);

            var canvasDims = [settings.width, settings.height];
            if (settings.autoLoad) {
                // derive canvas dimensions from mei facs
                canvasDims = page.calcDimensions($(mei).find("zone"));
                
                if (canvasDims[0] < settings.width) {
                    canvasDims[0] = settings.width;
                }
                if (canvasDims[1] < settings.height) {
                    canvasDims[1] = settings.height;
                }
            }
            page.setDimensions(canvasDims[0], canvasDims[1]);

            // make canvas dimensions the size of the page
            canvas.attr("width", page.width);
            canvas.attr("height", page.height);
            canvas.attr("style", "border: 4px black solid;");

            elem.prepend(canvas);

            var canvasOpts = {renderOnAddition: false};
            if (settings.backgroundImage) {
                $.extend(canvasOpts, {backgroundImage: settings.prefix+"/"+settings.backgroundImage+"/file", 
                                      backgroundOpacity: settings.backgroundOpacity});
            }
            rendEng.setCanvas(new fabric.Canvas(settings.canvasid, canvasOpts)); 
            
            if (settings.autoLoad && mei) {
                loadMeiPage(true);
            }

            console.log("Load successful. Neon.js ready.");
            var runTime = new Date() - startTime;
            console.log("loadtime: " + runTime + "ms");
        };
        
        // Call the init function when this object is created.
        init();
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
