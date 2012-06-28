#!/bin/bash

# should we download the latest google closure compiler?
if [ ! -f compiler.jar ]
then
    echo "Retrieving google closure compiler ..."
    wget http://closure-compiler.googlecode.com/files/compiler-latest.tar.gz
    tar xvfz compiler-latest.tar.gz
    rm {README,COPYING,compiler-latest.tar.gz}
fi

echo "Compiling Neon.js with google closure ..."
java -jar compiler.jar --js ../src/toe.js ../src/clef*.js ../src/custos*.js ../src/division*.js ../src/glyph.js ../src/gui.js ../src/nc.js ../src/neon.js ../src/neume*.js ../src/ornament.js ../src/page*.js ../src/renderengine.js ../src/staff*.js --js_output_file neon.min.js
echo "Built to neon.min.js"
