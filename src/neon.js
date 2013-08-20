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

// this pattern was taken from http://www.virgentech.com/blog/2009/10/building-object-oriented-jquery-plugin.html
(function($) {
    var Neon = function(element, options)
    {
        var elem = $(element);
        var mei;
        var rendEng;
        var startTime;

        // These are variables which can be overridden upon instantiation
        var defaults = {
            debug: false,
            glyphpath: "",
            meipath: "",
            bgimgpath: "",
            bgimgopacity: 0.60,
            apiprefix: "",
            origwidth: null,
            origheight: null,
            documentType: "liber",
            width: 1000
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
            rendEng = new Toe.View.RenderEngine();

            // set debug mode
            Toe.debug = settings.debug;

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
                   loadPage(),
                   handleBackgroundImage()
            ).then(loadSuccess,
                   function() {
                       console.log("Failure to load the mei file, glyphs, or background image");
                   }
            );
        };

        // asynchronous function
        var loadGlyphs = function(rendEng) {
            console.log("loading SVG glyphs ...");

            // return deferred promise
            return $.get(settings.glyphpath, function(svg) {
                var glyphs = new Object();

                // for each glyph, load it into fabric
                $(svg).find("svg").each(function(it, el) {
                    // http://stackoverflow.com/questions/652763/jquery-object-to-string
                    var rawSVG = $("<lol>").append($(el).clone()).remove().html();
                    fabric.loadSVGFromString(rawSVG, function(objects, options) {
                        var gID = $(el).attr("id");
                        var obj = fabric.util.groupSVGElements(objects, options);
                        glyphs[gID] = new Toe.Model.Glyph(gID, obj);
                    });
                });
                rendEng.setGlyphs(glyphs);
            });
        };

        // asynchronous function
        var handleBackgroundImage = function() {
            console.log("loading background image ...");
            var dfd = $.Deferred();

            if (settings.bgimgpath && !settings.origwidth && !settings.origheight) {
                fabric.Image.fromURL(settings.bgimgpath, function(img) {
                    settings.origwidth = img.width;
                    settings.origheight = img.height;
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
        var loadPage = function() {
            var dfd = $.Deferred();

            if (settings.meipath) {
                $.get(settings.meipath, function(data) {
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
            // create page with specific document type
            var page;
            
            switch (settings.documentType) {
                case "liber":
                case "salzinnes":
                    page = new Toe.Model.SquareNotePage(settings.documentType);
                    break;
                case "stgallen":
                    page = new Toe.Model.CheironomicPage(settings.documentType);
                    break;
            }

            // add canvas element to the element tied to the jQuery plugin
            var canvas = $("<canvas>").attr("id", settings.canvasid);

            var canvasDims = [settings.origwidth, settings.origheight];
            if (!settings.bgimgpath) {
                // derive canvas dimensions from mei facs
                canvasDims = page.calcDimensions($(mei).find("zone"));
            }

            // calculate scale based on width, maintaining aspect ratio
            page.setPageScale(settings.width/canvasDims[0]);
            page.setDimensions(Math.round(canvasDims[0]), Math.round(canvasDims[1]));

            // make canvas dimensions the size of the page
            canvas.attr("width", page.width);
            canvas.attr("height", page.height);
            canvas.attr("style", "border: 4px black solid;");

            elem.prepend(canvas);

            var canvasOpts = {renderOnAddition: false};
            if (settings.bgimgpath) {
                $.extend(canvasOpts, {backgroundImage: settings.bgimgpath,
                                      backgroundImageOpacity: settings.bgimgopacity,
                                      backgroundImageStretch: true});
            }
            rendEng.setCanvas(new fabric.Canvas(settings.canvasid, canvasOpts));

            if (Toe.debug) {
                // add FPS debug element
                var fpsDebug = $("<div>").attr("id", "fps");
                fpsDebug.attr("style", "color: red; font-size: 200%");
                elem.prepend(fpsDebug);

                rendEng.canvas.onFpsUpdate = function(fps) {
                    $(fpsDebug).html('FPS: ' + fps);
                };
            }

            /***************************
             * Instantiate MVC classes *
             ***************************/
            // VIEWS
            var pView = new Toe.View.PageView(rendEng);

            // CONTROLLERS
            var pCtrl = new Toe.Ctrl.PageController(page, pView);

            if (mei) {
                page.loadMei(mei, rendEng);
            }

            // instantiate appropriate GUI elements
            var gui = new Toe.View.GUI(settings.apiprefix, settings.meipath, rendEng,
                                      {sldr_bgImgOpacity: settings.bgimgpath, 
                                       initBgImgOpacity: settings.bgimgopacity});

            // handle user interactions with glyphs on the digital music score
            switch (settings.documentType) {
                case "liber":
                case "salzinnes":
                    var interaction = new Toe.View.SquareNoteInteraction(rendEng, page, settings.apiprefix);
                    break;
                case "stgallen":
                    var interaction = new Toe.View.CheironomicInteraction(rendEng, page, settings.apiprefix);
                    break;
            }

            var runTime = new Date() - startTime;
            console.log("Neon.js ready (" + runTime + "ms)");
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
