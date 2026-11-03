"""Adds a tapered underline swoosh to the signature json.
usage: python3 flourish.py signature.json x0,y0 x1,y1 x2,y2 x3,y3
(the four points are the cubic bezier of the swoosh centre line, in font units)
"""
import json, sys
import numpy as np

f = sys.argv[1]
sig = json.load(open(f))
P0, P1, P2, P3 = [np.array([float(v) for v in p.split(",")]) for p in sys.argv[2:6]]
t = np.linspace(0, 1, 90)[:, None]
C = (1 - t) ** 3 * P0 + 3 * (1 - t) ** 2 * t * P1 + 3 * (1 - t) * t ** 2 * P2 + t ** 3 * P3
d = np.gradient(C, axis=0)
n = np.c_[-d[:, 1], d[:, 0]] / np.linalg.norm(d, axis=1)[:, None]
# pen pressure: starts light, heavier through the middle, flicks out thin at the end
tt = t[:, 0]
w = 7.5 * np.sin(np.pi * tt ** 0.75) ** 0.9 + 0.5
top = C + n * w[:, None] / 2
bot = C - n * w[:, None] / 2
pts = np.r_[top, bot[::-1]]
shape = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z"
center = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in C[::3])
sig["flourish"] = {"shape": shape, "center": center, "len": float(np.sum(np.linalg.norm(np.diff(C, axis=0), axis=1)))}
# grow the box if the swoosh sticks out
x0, y0, W, H = sig["viewBox"]
x1, y1 = x0 + W, y0 + H
x0, y0 = min(x0, pts[:, 0].min() - 10), min(y0, pts[:, 1].min() - 10)
x1, y1 = max(x1, pts[:, 0].max() + 10), max(y1, pts[:, 1].max() + 10)
sig["viewBox"] = [round(float(v), 1) for v in (x0, y0, x1 - x0, y1 - y0)]
json.dump(sig, open(f, "w"))
print("flourish length", round(sig["flourish"]["len"]), "viewBox", sig["viewBox"])
