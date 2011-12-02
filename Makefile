
all: doc

#dist:
#	java -jar compiler.jar --compilation_level XXX --js <files> <output?>

doc:
	java -jar support/jsdoc/jsrun.jar \
        support/jsdoc/app/run.js -a jsdoc\
        -t=support/jsdoc/templates/jsdoc \
        -d=docs src/	

.PHONY: all doc
