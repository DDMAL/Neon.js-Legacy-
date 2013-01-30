Neon.js
=======

**N**eume **E**ditor **ON**line.

Neon.js is a browser-based music notation editor written in JavaScript. The editor can be used to manipulate digitally encoded early musical scores in square-note notation.

You can see a demo of Neon.js in action [here](http://ddmal.music.mcgill.ca/neondemo).

Requirements
------------

 * tornado: `pip install tornado`
 * python bindings of the solesmesbuild branch of libmei available [here](https://github.com/gburlet/libmei). 
    * Note: this requires the boost-python library. Installation instruction can be found [here](https://github.com/DDMAL/libmei/wiki).

Setup
-----

1. First, create a copy of the configuration file:  
```
cp conf.py{.dist,}
```

2. Edit the configuration file conf.py and set MEI_DIRECTORY and MEI_DIRECTORY_BACKUP somewhere writable.

3. Now compile the Neon.js code. Yes, compiling JavaScript. Wierd, right?  
```
cd build  
./build.sh {liber, salzinnes}  
ln -s neon.min.js ../src/neon.min.js  
```  
This script automatically downloads the latest google closure compiler, builds the drawing code for the liber or salzinnes manuscript, and places the minified JavaScript file into the proper location.

4. Now, start up the server:  
```
python server.py [port]
```  
If no port is provided, the default port is 8080.

Visit the Neon.js web application at http://localhost:[port].

Development
-----------

Documentation is provided by [jsdoc-toolkit](http://code.google.com/p/jsdoc-toolkit/)

Build docs with (java required):  
    `make doc`

Tests
-----

1. Client testing  
We're using Qunit for unit testing. Load `test/neontest.html` in a browser to run them.

2. Server testing  
To run server tests, install [python-nose](https://github.com/nose-devs/nose) and run `nosetests`

License
-------

Neon.js is distributed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
