#!/usr/bin/env bash
# Rebuilds src/data/signature.json (needs node + python3 with numpy, scipy, scikit-image, matplotlib)
set -e
cd "$(dirname "$0")"
# first line: Tejdeep
node outline.mjs MrsSaintDelafield-Regular.ttf Tejdeep 400 > /tmp/sig-outline-1.json
# stroke order picked by hand after looking at the debug render: T, stem, e+j, j loop, d, eep, p, dot of the j
python3 trace.py /tmp/sig-outline-1.json /tmp/sig-1.json 2 0,1r,2r,3,4r,7r,6,5,8r,9,10,11
# second line: Kellampalli, a bit smaller, moved down and right so the K tucks in under the j
node outline.mjs MrsSaintDelafield-Regular.ttf Kellampalli 320 170 325 > /tmp/sig-outline-2.json
# K top curl + downstroke, K arm, K stem, e eye, e+l, l, a, a stem, m, p loop, p bowl, a, l, l, i, dot
python3 trace.py /tmp/sig-outline-2.json /tmp/sig-2.json 2 0r,2r,1r,4,3,5,6,7,8,19r,9,11,10,12,13,14,15,16,17,18,20
python3 stack.py /tmp/sig-1.json /tmp/sig-2.json ../../src/data/signature.json 1.6
# underline under the surname
python3 flourish.py ../../src/data/signature.json 330,412 680,405 1050,372 1395,282
