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
java -jar compiler.jar --js ../src/*.js --js_output_file ../static/js/neon.min.js
if [ -a ../static/js/neon.min.js ]; then
    echo "Built to static/js/neon.min.js"
fi
