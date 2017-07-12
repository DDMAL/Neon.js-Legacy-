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
            
            //For Scaling small images
            var scaling = getBounds(rendEng, page);

            //Scaling:
            //[0] - [3] = bounds of the zoom to scale to, minmax of ulx uly lrx lry
            //[4], [5] = xFactor, yFactor
            //[6] = boolean on whether to scale or not
            
            if (rendEng.getGlobalScale() < 0.06) {
                scaling[6] = true;
                //Background Image
                fabric.Image.fromURL("http://localhost:8080" + settings.bgimgpath, function(oImg) {
                    var scaleFactor = settings.width/canvasDims[0];
                    oImg.scaleX = scaleFactor * scaling[4];
                    oImg.scaleY = scaleFactor * scaling[5];
                    oImg.left = ( (oImg.width * scaleFactor * scaling[4]) / 2 ) - scaling[0] * scaling[4];
                    oImg.top = ( (oImg.height * scaleFactor * scaling[5]) / 2 ) - scaling[1] * scaling[5];
                    oImg.selectable = false;
                    oImg.opacity = 0.5;

                    rendEng.canvas.add(oImg);
                    oImg.sendToBack();
                    rendEng.canvas.renderAll();
                });

                //Fabric elements
                objectScale(rendEng, scaling);
            }
            //Regular background image loading
            else {
                scaling[6] = false;
                fabric.Image.fromURL("http://localhost:8080" + settings.bgimgpath, function(oImg) {
                    var scaleFactor = settings.width/canvasDims[0];
                    oImg.scale(scaleFactor);
                    oImg.left = ( (oImg.width * scaleFactor) / 2 );
                    oImg.top = ( (oImg.height * scaleFactor) / 2 );
                    oImg.selectable = false;
                    oImg.opacity = 0.5;

                    rendEng.canvas.add(oImg);
                    oImg.sendToBack();
                    rendEng.canvas.renderAll();
                });
            }

            // instantiate appropriate GUI elements
            var gui = new Toe.View.GUI(settings.apiprefix, settings.meipath, rendEng, page,
                                      {sldr_bgImgOpacity: settings.bgimgpath, 
                                       initBgImgOpacity: settings.bgimgopacity});

            // handle user interactions with glyphs on the digital music score
            switch (settings.documentType) {
                case "liber":
                case "salzinnes":
                    var interaction = new Toe.View.SquareNoteInteraction(rendEng, scaling, page, settings.apiprefix);
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

    var getBounds = function(rendEng, page) {
        // Get all the systems and get the right bb values
        var ulx = 2000;
        var uly = 2000;
        var lrx = 0;
        var lry = 0;

        //TODO: Optimize this comparison function somehow?
        var objects = rendEng.canvas.getObjects();

        objects.map(function(o) {
            if (o.eleRef) {
                var zone = o.eleRef.zone;
                if (zone.ulx < ulx) ulx = zone.ulx;
                if (zone.uly < uly) uly = zone.uly;
                if (zone.lrx > lrx) lrx = zone.lrx;
                if (zone.lry > lry) lry = zone.lry;
            }
        });

        //Math lol
        var xFactor = rendEng.canvas.getWidth() / ( (lrx - ulx));
        var yFactor = rendEng.canvas.getHeight() / ( (lry - uly));

        return [ulx, uly, lrx, lry, xFactor, yFactor];
    }

    var objectScale = function(rendEng, scaling) {
        var ulx = scaling[0];
        var uly = scaling[1];
        var lrx = scaling[2];
        var lry = scaling[3];
        var xFactor = scaling[4];
        var yFactor = scaling[5];

        var objects = rendEng.canvas.getObjects();
        //Code for scaling
        for (var i in objects) {
            var scaleX = objects[i].scaleX;
            var scaleY = objects[i].scaleY;
            var left = objects[i].left;
            var top = objects[i].top;

            var tempScaleX = scaleX * xFactor;
            var tempScaleY = scaleY * yFactor;
            var tempLeft = left * xFactor - (ulx * xFactor);
            var tempTop = top * yFactor - (uly * yFactor);

            objects[i].scaleX = tempScaleX;
            objects[i].scaleY = tempScaleY;
            objects[i].left = tempLeft;
            objects[i].top = tempTop;

            //Code for zones
            if (objects[i].eleRef) {
                objects[i].eleRef.zone.ulx = objects[i].eleRef.zone.ulx * xFactor - (xFactor * ulx);
                objects[i].eleRef.zone.uly = objects[i].eleRef.zone.uly * yFactor - (yFactor * uly);
                objects[i].eleRef.zone.lrx = objects[i].eleRef.zone.lrx * xFactor - (xFactor * ulx);
                objects[i].eleRef.zone.lry = objects[i].eleRef.zone.lry * yFactor - (yFactor * uly);
            }

            //Calculating global scale + changing delta_y of each system
            if (objects[i].eleRef instanceof Toe.Model.SquareNoteSystem) {
                rendEng.calcScaleFromSystem(objects[i].eleRef, {overwrite: true});
                objects[i].delta_y = Math.abs(objects[i].eleRef.zone.lry - objects[i].eleRef.zone.uly) / 3;
                objects[i].eleRef.delta_y = Math.abs(objects[i].eleRef.zone.lry - objects[i].eleRef.zone.uly) / 3;
            }
            objects[i].setCoords();
        }
        rendEng.canvas.renderAll();
        rendEng.canvas.calcOffset();
    }

    $.fn.neon = function(options)
    {
        return this.each(function()
        {
            var element = $(this);

            // Return early if this element already has a plugin instance
            if (element.data('neon'))
            {
                element.empty();
            }

            // pass options to plugin constructor
            var neon = new Neon(this, options);

            // Store plugin object in this element's data
            element.data('neon', neon);
        });
    };
})(jQuery);
