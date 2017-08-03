BUILD_DIR = build

all: doc

dist:
	cd $(BUILD_DIR); ./build.sh

doc:
	java -jar support/jsdoc/jsrun.jar \
        support/jsdoc/app/run.js -a jsdoc\
        -t=support/jsdoc/templates/jsdoc \
        -d=docs src/	

.PHONY: all doc
