#!/bin/bash

echo "Retrieving google closure compiler ..."
wget http://closure-compiler.googlecode.com/files/compiler-latest.tar.gz
tar xvfz compiler-latest.tar.gz
echo "Compiling Neon.js with google closure ..."
java -jar compiler.jar --js ../src/toe.js ../src/clef*.js ../src/custos*.js ../src/division*.js ../src/glyph.js ../src/gui.js ../src/nc.js ../src/neon.js ../src/neume*.js ../src/ornament.js ../src/page*.js ../src/renderengine.js ../src/staff*.js --js_output_file neon.min.js
echo "Built to neon.min.js"
