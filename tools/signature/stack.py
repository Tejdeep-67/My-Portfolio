"""Puts the traced first name and surname together into one signature json.
usage: python3 stack.py first.json last.json out.json [grow]
Both words were traced in the same coordinates (the surname is already moved
down and to the right by outline.mjs), so this only merges them. The surname
is set a bit smaller, so "grow" adds a thin outline stroke to it to keep the
ink weight close to the first name.
"""
import json, sys

a = json.load(open(sys.argv[1]))
b = json.load(open(sys.argv[2]))
grow = float(sys.argv[4]) if len(sys.argv) > 4 else 0

def box(s):
    x, y, w, h = s["viewBox"]
    return x, y, x + w, y + h

ax0, ay0, ax1, ay1 = box(a)
bx0, by0, bx1, by1 = box(b)
x0, y0 = min(ax0, bx0), min(ay0, by0)
x1, y1 = max(ax1, bx1), max(ay1, by1)
out = {
    "viewBox": [round(x0, 1), round(y0, 1), round(x1 - x0, 1), round(y1 - y0, 1)],
    "lines": [
        {"outline": a["outline"], "pen": a["pen"], "grow": 0, "strokes": a["strokes"]},
        {"outline": b["outline"], "pen": round(b["pen"] + grow, 1), "grow": grow, "strokes": b["strokes"]},
    ],
}
json.dump(out, open(sys.argv[3], "w"))
print("viewBox", out["viewBox"])
