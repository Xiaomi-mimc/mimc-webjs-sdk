#!/bin/sh
rm -f mimc-js/mimc-min.js
python2.7 closure-library/closure/bin/build/closurebuilder.py --root=closure-library/ --root=mimc-js/ --namespace="mimc" --output_mode=compiled --compiler_jar=compiler.jar  > mimc-js/mimc-min.js
