Neon.js
=======

**N**eume **E**ditor **ON**line.

Requirements
------------

 * tornado (pip install tornado)
 * pymei (https://github.com/ahankinson/pymei)

Running the server
------------------

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

