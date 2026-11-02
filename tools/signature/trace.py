
"""Turn a script-font word into pen strokes for the intro animation.

The font outline is filled, so its skeleton (centre line) is used as the
"pen path". Strokes are ordered roughly the way you would write: left to
right, following the straightest branch at every junction, tiny pieces
(the dot of the j) last.

usage: python3 trace.py outline.json out.json [scale] [order]
order (optional) is a comma list of stroke indexes to keep, in writing
order; "r" after an index draws that stroke backwards, e.g. 0,1r,2,3
"""
import json, sys, math
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.path import Path
from matplotlib.patches import PathPatch
from scipy import ndimage
from skimage.morphology import skeletonize

src, out = sys.argv[1], sys.argv[2]
S = float(sys.argv[3]) if len(sys.argv) > 3 else 2.0
data = json.load(open(src))
box = data["box"]
pad = 20
ox, oy = box["x1"] - pad, box["y1"] - pad
W = int((box["x2"] - box["x1"] + 2 * pad) * S)
H = int((box["y2"] - box["y1"] + 2 * pad) * S)

# --- rasterise the outline -------------------------------------------------
verts, codes = [], []
cur = None
for c in data["commands"]:
    t = c["type"]
    if t == "M":
        verts.append((c["x"], c["y"])); codes.append(Path.MOVETO); start = (c["x"], c["y"])
    elif t == "L":
        verts.append((c["x"], c["y"])); codes.append(Path.LINETO)
    elif t == "Q":
        verts += [(c["x1"], c["y1"]), (c["x"], c["y"])]; codes += [Path.CURVE3] * 2
    elif t == "C":
        verts += [(c["x1"], c["y1"]), (c["x2"], c["y2"]), (c["x"], c["y"])]; codes += [Path.CURVE4] * 3
    elif t == "Z":
        verts.append(start); codes.append(Path.CLOSEPOLY)
path = Path(verts, codes)

fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
ax = fig.add_axes([0, 0, 1, 1]); ax.axis("off")
ax.set_xlim(ox, ox + W / S); ax.set_ylim(oy + H / S, oy)
ax.add_patch(PathPatch(path, facecolor="black", edgecolor="none", antialiased=False))
fig.canvas.draw()
img = np.asarray(fig.canvas.buffer_rgba())[:, :, 0]
plt.close(fig)
ink = img < 128

# --- skeleton + thickness --------------------------------------------------
ink = ndimage.binary_closing(ink, iterations=1)
dist = ndimage.distance_transform_edt(ink)
sk = skeletonize(ink)

ys, xs = np.nonzero(sk)
pix = set(zip(ys.tolist(), xs.tolist()))
N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
def nb(p):
    return [(p[0] + a, p[1] + b) for a, b in N8 if (p[0] + a, p[1] + b) in pix]

def build_edges():
    deg = {p: len(nb(p)) for p in pix}
    nodes = {p for p in pix if deg[p] != 2}
    edges, seen = [], set()
    for n in nodes:
        for q in nb(n):
            if (n, q) in seen:
                continue
            chain = [n, q]; prev, cur = n, q
            while cur not in nodes:
                nxt = [r for r in nb(cur) if r != prev and r not in chain[-3:]]
                if not nxt:
                    break
                prev, cur = cur, nxt[0]; chain.append(cur)
            seen.add((chain[0], chain[1])); seen.add((chain[-1], chain[-2]))
            edges.append(chain)
    # closed loops with no node at all (e.g. a ring)
    covered = {p for e in edges for p in e}
    for p in pix - covered:
        if p in covered:
            continue
        chain = [p]; prev, cur = None, p
        while True:
            nxt = [r for r in nb(cur) if r != prev and r not in chain]
            if not nxt:
                break
            prev, cur = cur, nxt[0]; chain.append(cur)
        covered |= set(chain); edges.append(chain + [p])
    return edges, deg

# prune short spurs a few times
spur = 2.2 * float(np.median(dist[sk])) + 4 * S
for _ in range(4):
    edges, deg = build_edges()
    removed = False
    for e in edges:
        a, b = e[0], e[-1]
        if len(e) < spur and ((deg[a] == 1) != (deg[b] == 1)):
            for p in e[1:-1] + [x for x in (a, b) if deg[x] == 1]:
                pix.discard(p)
            removed = True
    if not removed:
        break
edges, deg = build_edges()
edges = [e for e in edges if len(e) > 2]

# --- order the edges into pen strokes ----------------------------------------
# junction pixels that touch (or sit very close, like the two halves of an X
# crossing) are merged into one node
node_px = [p for p in pix if deg[p] != 2]
lab = {}
k = 0
for p in node_px:
    if p in lab:
        continue
    stack = [p]; lab[p] = k
    while stack:
        q = stack.pop()
        for r in node_px:
            if r not in lab and abs(r[0] - q[0]) <= 2 and abs(r[1] - q[1]) <= 2:
                lab[r] = k; stack.append(r)
    k += 1
# short edges joining two junctions get collapsed too
parent = list(range(k))
def find(a):
    while parent[a] != a:
        parent[a] = parent[parent[a]]; a = parent[a]
    return a
merge_len = 1.4 * float(np.percentile(dist[sk], 90))
for e in edges:
    a, b = e[0], e[-1]
    if a in lab and b in lab and deg[a] > 2 and deg[b] > 2 and len(e) < merge_len:
        parent[find(lab[a])] = find(lab[b])
keep = []
for e in edges:
    a, b = e[0], e[-1]
    if a in lab and b in lab and deg[a] > 2 and deg[b] > 2 and len(e) < merge_len and find(lab[a]) == find(lab[b]) and e[0] != e[-1]:
        continue
    keep.append(e)
edges = keep
def node_of(p):
    return find(lab[p]) if p in lab else None

def direction(chain, at_end, skip=4, k=18):
    seg = chain[::-1] if at_end else chain
    seg = seg[skip:skip + k] if len(seg) > skip + 4 else seg
    (y0, x0), (y1, x1) = seg[0], seg[-1]
    v = np.array([x0 - x1, y0 - y1], float) if not at_end else np.array([x0 - x1, y0 - y1], float)
    # v points along travel direction at the end (at_end) / away from the start
    if not at_end:
        v = -v
    return v / (np.linalg.norm(v) + 1e-9)

used = [False] * len(edges)
strokes = []
def pick_start():
    best = None
    for i, e in enumerate(edges):
        if used[i]:
            continue
        for rev in (False, True):
            c = e[::-1] if rev else e
            free = deg.get(c[0], 2) == 1
            score = c[0][1] - (60 * S if free else 0)
            if best is None or score < best[0]:
                best = (score, i, rev)
    return best

while not all(used):
    _, i, rev = pick_start()
    chain = edges[i][::-1] if rev else edges[i][:]
    used[i] = True
    while True:
        nd = node_of(chain[-1])
        if nd is None:
            break
        d0 = direction(chain, True)
        cand = []
        for j, e in enumerate(edges):
            if used[j]:
                continue
            for r in (False, True):
                c = e[::-1] if r else e
                if node_of(c[0]) == nd:
                    cand.append((float(np.dot(d0, direction(c, False))), j, c))
        if not cand:
            break
        turn, j, c = max(cand, key=lambda t: t[0])
        if turn < -0.5:
            break
        used[j] = True; chain += c[1:]
    strokes.append(chain)

def smooth(chain, step=3.0):
    pts = np.array([(x / S + ox, y / S + oy) for y, x in chain], float)
    # resample by arc length
    seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    if seg[-1] < 1:
        return pts
    n = max(int(seg[-1] / step), 4)
    t = np.linspace(0, seg[-1], n)
    pts = np.c_[np.interp(t, seg, pts[:, 0]), np.interp(t, seg, pts[:, 1])]
    k = 2.0
    sm = np.c_[ndimage.gaussian_filter1d(pts[:, 0], k, mode="nearest"), ndimage.gaussian_filter1d(pts[:, 1], k, mode="nearest")]
    sm[0], sm[-1] = pts[0], pts[-1]
    return sm

def to_d(p, every=4):
    p = p[::every] if len(p) > 2 * every else p
    if len(p) < 2:
        return ""
    d = f"M{p[0][0]:.1f} {p[0][1]:.1f}"
    for i in range(len(p) - 1):
        p0 = p[max(i - 1, 0)]; p1 = p[i]; p2 = p[i + 1]; p3 = p[min(i + 2, len(p) - 1)]
        c1 = p1 + (p2 - p0) / 6; c2 = p2 - (p3 - p1) / 6
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return d

res = []
rev_pts = {}
for ch in strokes:
    p = smooth(ch)
    length = float(np.sum(np.linalg.norm(np.diff(p, axis=0), axis=1)))
    if length < 2:
        continue
    res.append({"d": to_d(p), "len": round(length, 1), "x": float(p[:, 0].min())})
    rev_pts[res[-1]["d"]] = p
# tiny marks (dots) go last, like dotting the j after writing the word
big = [r for r in res if r["len"] > 25]
small = [r for r in res if r["len"] <= 25]
res = big + small
if len(sys.argv) > 4:
    picked = []
    for tok in sys.argv[4].split(","):
        r = dict(res[int(tok.rstrip("r"))])
        if tok.endswith("r"):
            r["d"] = to_d(rev_pts[r["d"]][::-1])
        picked.append(r)
    res = picked
thick = float(np.percentile(dist[sk], 95)) / S
json.dump({"viewBox": [ox, oy, W / S, H / S], "outline": data["d"], "pen": round(2 * thick + 2, 1), "strokes": res}, open(out, "w"))
print(len(res), "strokes; pen width", round(2 * thick + 2, 1), [r["len"] for r in res])
