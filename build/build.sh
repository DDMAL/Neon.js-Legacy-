#!/bin/bash

# should we download the latest google closure compiler?
if [ ! -f compiler.jar ]
then
    echo "Retrieving google closure compiler ..."
    curl "http://dl.google.com/closure-compiler/compiler-latest.zip" -o "compiler-latest.zip"
    unzip compiler-latest.zip
    rm {README.md,COPYING,compiler-latest.zip}
fi

echo "Compiling Neon.js with google closure ..."
java -jar *.jar --js ../src/{neon.js,toe.js,model.js,controller.js,view.js,glyph.js,renderengine.js,clef*.js,gui.js,ornament.js,page*.js,system*.js,../static/js/support/searchtree.min.js,nn/interaction.js,nn/nc.js,nn/neume*.js,nn/squarenote/custos*.js,nn/squarenote/division*.js,nn/squarenote/liberneumes.js,nn/squarenote/salzinneneumes.js,nn/squarenote/squarenote*.js,nn/cheironomic/cheironomic*.js,nn/cheironomic/hartkerneumes.js} --js_output_file ../static/js/neon.min.js
#../src/{*.js,nn/*.js,nn/squarenote/*.js,nn/cheironomic/*.js} --js_output_file ../static/js/neon.min.js
if [ -a ../static/js/neon.min.js ]; then
    echo "Built to static/js/neon.min.js"
fi
