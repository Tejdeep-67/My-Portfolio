#!/usr/bin/env bash
# Rebuilds src/data/signature.json (needs node + python3 with numpy, scipy, scikit-image, matplotlib)
set -e
cd "$(dirname "$0")"
node outline.mjs MrsSaintDelafield-Regular.ttf Tejdeep 400 > /tmp/sig-outline.json
# stroke order picked by hand after looking at the debug render: T, stem, e+j, j loop, d, eep, p, dot of the j
python3 trace.py /tmp/sig-outline.json ../../src/data/signature.json 2 0,1r,2r,3,4r,7r,6,5,8r,9,10,11
python3 flourish.py ../../src/data/signature.json
