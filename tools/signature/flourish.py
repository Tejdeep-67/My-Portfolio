
"""Adds a tapered underline swoosh to the traced signature json.
usage: python3 flourish.py signature.json
"""
import json, sys
import numpy as np

f = sys.argv[1]
sig = json.load(open(f))
# centre line of the swoosh (cubic bezier), in the same units as the font outline
P0, P1, P2, P3 = map(np.array, [(110, 96), (380, 70), (650, 58), (935, -12)])
t = np.linspace(0, 1, 90)[:, None]
C = (1 - t) ** 3 * P0 + 3 * (1 - t) ** 2 * t * P1 + 3 * (1 - t) * t ** 2 * P2 + t ** 3 * P3
d = np.gradient(C, axis=0)
n = np.c_[-d[:, 1], d[:, 0]] / np.linalg.norm(d, axis=1)[:, None]
# pen pressure: starts light, heavier through the middle, flicks out thin at the end
tt = t[:, 0]
w = 6.0 * np.sin(np.pi * tt ** 0.75) ** 0.9 + 0.5
top = C + n * w[:, None] / 2
bot = C - n * w[:, None] / 2
pts = np.r_[top, bot[::-1]]
shape = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z"
center = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in C[::3])
sig["flourish"] = {"shape": shape, "center": center, "len": float(np.sum(np.linalg.norm(np.diff(C, axis=0), axis=1)))}
x0, y0, W, H = sig["viewBox"]
sig["viewBox"] = [round(x0, 1), round(y0, 1), round(max(W, 960 - x0), 1), round(H, 1)]
json.dump(sig, open(f, "w"))
print("flourish length", round(sig["flourish"]["len"]), "viewBox", sig["viewBox"])
