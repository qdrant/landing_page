"""The hnsw_ef diagram for the candidate-depth article.

Conceptual, not a measurement. One wide graph, one query, two search widths.
hnsw_ef widens the set of VISITED nodes (dotted outlines that follow the
graph, not distance rings); the returned count stays at `limit`, so the wider
walk reaches a near neighbor the narrow walk missed and that neighbor
displaces a worse one. Palette follows the Docs - Diagrams Figma file.
"""

import matplotlib

matplotlib.use("Agg")

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyBboxPatch, Polygon

BACKGROUND = "#e2e7f5"
CARD = "#ffffff"
INK = "#414650"
EDGE = "#b9bec7"
TEAL = "#4fb3a9"
TEAL_FILL = "#e0f2f1"
ORANGE = "#f59300"
ORANGE_FILL = "#fdf0d9"
MONO = ["DejaVu Sans Mono", "Menlo", "monospace"]

OUT = ("../../qdrant-landing/static/articles_data/candidate-depth/"
       "hnsw-ef-saturation.png")

# ---------------------------------------------------------------- layout ----
# Canvas is 12 x 4.75 units (rendered 2400 x 950 px). Card inset 0.3.
# Special nodes hand-placed; filler nodes hand-placed too, so the layout is
# deterministic and each one can be nudged.
#
# Semantics: query near center-left. Entry top-left, orange walk descends to
# the query neighborhood. Returned at both widths: 4 nodes.
#   ef=16  returns a, b, c, x        (x = worst of the four)
#   ef=512 returns a, b, c, d        (d displaces x; x drawn hollow "dropped")
# d sits CLOSER to the query than x (and c), but its only edges run to the
# far right side, so the narrow greedy walk never reaches it.
NODES = {
    # query neighborhood
    "q": (4.55, 2.10),
    "a": (3.85, 2.72),   # kept, teal
    "b": (5.15, 2.65),   # kept, teal
    "c": (3.70, 1.55),   # kept, teal
    "x": (3.45, 1.15),   # dropped at ef=512: the worst of the ef=16 top 4
    "d": (5.30, 1.85),   # the near neighbor only the wide walk reaches
    # entry + walk
    "e":  (1.45, 4.05),
    "w1": (2.45, 3.55),
    "w2": (3.35, 3.20),
    # left / far-left filler
    "l1": (0.85, 2.95), "l2": (0.70, 1.70), "l3": (1.55, 0.85),
    "l4": (1.90, 2.30), "l5": (2.75, 1.30), "l6": (2.90, 2.45),
    "l7": (2.60, 0.55),
    # top band
    "t1": (4.60, 3.90), "t2": (5.90, 3.95), "t3": (7.30, 4.00),
    "t4": (8.75, 3.85), "t5": (10.20, 3.90), "t6": (11.25, 3.30),
    # right side (the far side d hangs off)
    "r1": (6.45, 3.05), "r2": (7.60, 2.90), "r3": (8.90, 2.95),
    "r4": (10.35, 2.60), "r5": (11.30, 1.85),
    "r6": (6.85, 1.90), "r7": (8.15, 1.75), "r8": (9.55, 1.55),
    "r9": (10.55, 0.90),
    # bottom band
    "b1": (3.85, 0.55), "b2": (5.30, 0.45), "b3": (6.60, 0.75),
    "b4": (7.85, 0.55), "b5": (9.15, 0.60),
}

EDGES = [
    # entry walk spine
    ("e", "w1"), ("w1", "w2"), ("w2", "a"),
    # entry hub
    ("e", "l1"), ("e", "t1"),
    # query neighborhood mesh
    ("a", "q"), ("b", "q"), ("c", "q"), ("x", "q"),
    ("a", "b"), ("c", "l5"), ("x", "l5"), ("x", "b1"),
    ("a", "l6"), ("b", "t1"), ("b", "r1"),
    # d's ONLY edges: they run to the far right side
    ("d", "r6"), ("d", "b3"),
    # left mesh
    ("l1", "l2"), ("l1", "l4"), ("l2", "l3"), ("l3", "l7"), ("l4", "l6"),
    ("l4", "w1"), ("l5", "l7"), ("l5", "l6"), ("l2", "l4"), ("l3", "l5"),
    ("w2", "t1"), ("l6", "w2"),
    # top band
    ("t1", "t2"), ("t2", "t3"), ("t3", "t4"), ("t4", "t5"), ("t5", "t6"),
    ("t2", "r1"), ("t3", "r2"), ("t4", "r3"), ("t5", "r4"),
    # right mesh (hubs r2, r7)
    ("r1", "r2"), ("r2", "r3"), ("r3", "r4"), ("r4", "r5"),
    ("r1", "r6"), ("r2", "r6"), ("r2", "r7"), ("r3", "r8"),
    ("r6", "r7"), ("r7", "r8"), ("r8", "r9"), ("r5", "r9"), ("t6", "r5"),
    # bottom band
    ("b1", "b2"), ("b2", "b3"), ("b3", "b4"), ("b4", "b5"),
    ("l7", "b1"), ("b3", "r6"), ("b4", "r7"), ("b5", "r8"), ("b5", "r9"),
    ("l5", "b1"),
]

# Orange traversal: entry point walking in to the query neighborhood.
WALK = ["e", "w1", "w2", "a", "q"]

RETURNED_KEPT = ("a", "b", "c")   # teal at both widths
RETURNED_NEW = "d"                # orange, reached only at ef=512
DROPPED = "x"                     # in the ef=16 top 4, displaced at ef=512

# Visited sets (which nodes each walk touches). Narrow: the walk plus the
# local mesh around the query -- and NOT d, whose edges come from the right.
VISITED_16 = ["e", "w1", "w2", "a", "b", "c", "x", "q", "l6", "l5", "l4", "t1"]
# Wide: everything.
VISITED_512 = list(NODES)


def hull_outline(names, pad=0.42, extra=()):
    """Padded convex hull around a node set, Chaikin-smoothed."""
    pts = np.array([NODES[n] for n in names] + [tuple(p) for p in extra])
    center = pts.mean(axis=0)
    # convex hull by angle sort of extreme points (gift wrap via scipy-free)
    hull = _convex_hull(pts)
    # push each hull vertex outward from the centroid
    out = []
    for p in hull:
        v = p - center
        d = np.hypot(*v)
        out.append(p + v / d * pad)
    return _chaikin(np.array(out), iters=5)


def _cross2(a, b):
    return a[0] * b[1] - a[1] * b[0]


def _convex_hull(pts):
    pts = pts[np.lexsort((pts[:, 1], pts[:, 0]))]

    def half(seq):
        h = []
        for p in seq:
            while len(h) >= 2 and _cross2(h[-1] - h[-2], p - h[-2]) <= 0:
                h.pop()
            h.append(p)
        return h

    lower = half(pts)
    upper = half(pts[::-1])
    return np.array(lower[:-1] + upper[:-1])


def _chaikin(pts, iters=4):
    for _ in range(iters):
        nxt = np.empty((2 * len(pts), 2))
        rolled = np.roll(pts, -1, axis=0)
        nxt[0::2] = 0.75 * pts + 0.25 * rolled
        nxt[1::2] = 0.25 * pts + 0.75 * rolled
        pts = nxt
    return pts


def main():
    fig = plt.figure(figsize=(12, 4.75))
    fig.patch.set_facecolor(BACKGROUND)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 4.75)
    ax.set_aspect("equal")
    ax.axis("off")

    ax.add_patch(FancyBboxPatch((0.22, 0.22), 11.56, 4.31,
                                boxstyle="round,pad=0.02,rounding_size=0.14",
                                facecolor=CARD, edgecolor="none", zorder=0))

    # graph edges
    for u, v in EDGES:
        (x0, y0), (x1, y1) = NODES[u], NODES[v]
        ax.plot([x0, x1], [y0, y1], color=EDGE, linewidth=1.0,
                linestyle=(0, (2, 2)), zorder=1)

    # visited-set outlines with a light fill tint
    narrow = hull_outline(VISITED_16, pad=0.30)
    wide = hull_outline(VISITED_512, pad=0.34)
    ax.add_patch(Polygon(wide, closed=True, facecolor="none",
                         edgecolor=INK, linewidth=1.5,
                         linestyle=(0, (1.5, 2.5)), zorder=2))
    ax.add_patch(Polygon(narrow, closed=True, facecolor=TEAL_FILL,
                         alpha=0.45, edgecolor="none", zorder=1.5))
    ax.add_patch(Polygon(narrow, closed=True, facecolor="none",
                         edgecolor=INK, linewidth=1.5,
                         linestyle=(0, (1.5, 2.5)), zorder=2))

    def tag(x, y, text, ha="center", va="center", fs=14):
        ax.text(x, y, text, fontsize=fs, color=INK, family=MONO,
                ha=ha, va=va, zorder=8,
                bbox=dict(boxstyle="round,pad=0.28", facecolor=CARD,
                          edgecolor=EDGE, linewidth=0.8))

    # outline labels, hand-placed in quiet spots on each boundary
    tag(5.12, 3.44, "hnsw_ef=16")
    tag(1.30, 0.42, "hnsw_ef=512")

    # orange entry walk
    wx = [NODES[n][0] for n in WALK]
    wy = [NODES[n][1] for n in WALK]
    ax.plot(wx, wy, color=ORANGE, linewidth=2.4, linestyle=(0, (4, 3)),
            zorder=3, solid_capstyle="round")

    R_BIG, R_DOT, R_SMALL = 0.115, 0.045, 0.052
    for name, (x, y) in NODES.items():
        if name == "q":
            continue
        if name in RETURNED_KEPT:
            ax.add_patch(Circle((x, y), R_BIG, facecolor=TEAL_FILL,
                                edgecolor=TEAL, linewidth=2.6, zorder=4))
            ax.add_patch(Circle((x, y), R_DOT, facecolor=INK,
                                edgecolor="none", zorder=5))
        elif name == RETURNED_NEW:
            ax.add_patch(Circle((x, y), R_BIG, facecolor=ORANGE_FILL,
                                edgecolor=ORANGE, linewidth=2.6, zorder=4))
            ax.add_patch(Circle((x, y), R_DOT, facecolor=INK,
                                edgecolor="none", zorder=5))
        elif name == DROPPED:
            ax.add_patch(Circle((x, y), R_BIG, facecolor="none",
                                edgecolor=EDGE, linewidth=2.6,
                                linestyle=(0, (1.5, 1.5)), zorder=4))
            ax.add_patch(Circle((x, y), R_DOT, facecolor=INK,
                                edgecolor="none", zorder=5))
            ax.text(x - 0.22, y + 0.02, "dropped", fontsize=13, color=INK,
                    family=MONO, ha="right", va="center", zorder=8,
                    bbox=dict(boxstyle="round,pad=0.12", facecolor=CARD,
                              edgecolor="none"))
        elif name == "e":
            ax.add_patch(Circle((x, y), 0.075, facecolor=ORANGE,
                                edgecolor="none", zorder=4))
            ax.text(x + 0.24, y + 0.20, "entry", fontsize=14, color=INK,
                    family=MONO, ha="left", va="center", zorder=8,
                    bbox=dict(boxstyle="round,pad=0.12", facecolor=CARD,
                              edgecolor="none"))
        else:
            ax.add_patch(Circle((x, y), R_SMALL, facecolor=INK,
                                edgecolor="none", zorder=4))

    # query cross
    qx, qy = NODES["q"]
    r = 0.085
    for sign in (1, -1):
        ax.plot([qx - r, qx + r], [qy - sign * r, qy + sign * r], color=TEAL,
                linewidth=3.2, zorder=6, solid_capstyle="round")
    ax.text(qx - 0.18, qy - 0.02, "query", fontsize=14, color=INK,
            family=MONO, ha="right", va="center", zorder=8,
            bbox=dict(boxstyle="round,pad=0.12", facecolor=CARD,
                      edgecolor="none"))

    fig.savefig(OUT, dpi=200, facecolor=BACKGROUND)
    print("wrote", OUT)


def check():
    """Correctness self-check: same returned count, d nearer than x and c."""
    q = np.array(NODES["q"])

    def dist(n):
        return float(np.hypot(*(np.array(NODES[n]) - q)))

    ret16 = set(RETURNED_KEPT) | {DROPPED}
    ret512 = set(RETURNED_KEPT) | {RETURNED_NEW}
    assert len(ret16) == len(ret512) == 4
    assert dist(RETURNED_NEW) < dist(DROPPED), (dist(RETURNED_NEW), dist(DROPPED))
    # d touches nothing in the narrow visited set
    for u, v in EDGES:
        if RETURNED_NEW in (u, v):
            other = v if u == RETURNED_NEW else u
            assert other not in VISITED_16, (u, v)


if __name__ == "__main__":
    check()
    main()
