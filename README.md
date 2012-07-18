Neon.js
=======

**N**eume **E**ditor **ON**line.

Neon.js is a browser-based music notation editor written in JavaScript. The editor can be used to manipulate digitally encoded early musical scores in square-note notation.

You can see a demo of Neon.js in action at http://ddmal.music.mcgill.ca/neondemo

Requirements
------------

 * tornado (pip install tornado)
 * python bindings of the experimental-meisolesmes branch of libmei (https://github.com/DDMAL/libmei)

Setup
-----
    cd build
    ./build.sh {liber, salzinnes}
    ln -s neon.min.js ../src/neon.min.js
    cp conf.py{.dist,}
    # edit conf.py and set MEI_DIRECTORY somewhere writable
    python server.py [port]

Visit the app at http://localhost:8080

Development
-----------

Documentation is provided by jsdoc-toolkit: http://code.google.com/p/jsdoc-toolkit/

Build docs with (java required)

    make doc

Tests
-----

We're using qunit for tests. Load ```test/neontest.html``` in a browser to run them

To run server tests, install [python-nose](https://github.com/nose-devs/nose) and run `nosetests`

