"""The hnsw_ef diagram for the candidate-depth article.

Conceptual, not a measurement. One graph, one query, two search widths.
hnsw_ef widens the set of VISITED nodes (dotted blobs that follow the graph,
not distance rings); the returned count stays at `limit`, so the wider walk
reaches a near neighbor the narrow walk missed and that neighbor displaces a
worse one. Palette follows the Docs - Diagrams Figma file.
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

# One layout shared by both panels, in panel-local coordinates.
NODES = {
    "q":  (0.00, 0.02),
    "a":  (-0.30, 0.34), "b": (0.36, 0.22), "c": (-0.42, -0.28),
    # d sits closer to the query than any returned neighbor; in the right
    # panel it is wired only through the far side, so nearness alone does
    # not make it reachable
    "d":  (0.20, -0.22),
    "e":  (-0.10, 1.06),                       # entry point
    "m2": (0.16, 0.66),
    "m1": (-0.78, 0.10), "m3": (0.82, -0.06), "m4": (-0.50, 0.76),
    "m5": (0.78, 0.62), "m6": (-0.12, -0.78), "m7": (0.72, -0.66),
    "m8": (-0.74, -0.60),
}

EDGES_COMMON = [
    ("e", "m2"), ("e", "m4"), ("e", "m5"), ("m2", "a"), ("m2", "b"),
    ("a", "q"), ("b", "q"), ("c", "q"), ("a", "m4"), ("a", "m1"),
    ("b", "m5"), ("b", "m3"), ("c", "m1"), ("c", "m8"), ("c", "m6"),
    ("m1", "m4"), ("m1", "m8"), ("m8", "m6"), ("m3", "m5"), ("m3", "m7"),
    ("m6", "m7"),
]
# Left: d is wired into the local mesh, so the narrow walk finds everything
# near the query. Right: d hangs off the far side only, so the narrow greedy
# walk never turns toward it even though it sits right next to the query.
EDGES_LEFT = EDGES_COMMON + [("d", "q"), ("d", "b"), ("d", "m6")]
EDGES_RIGHT = EDGES_COMMON + [("d", "m7"), ("d", "m3")]

# Orange traversal: entry point walking in to the query neighborhood.
WALK = ["e", "m2", "a", "q"]

# Dotted outlines around the VISITED nodes (hand-placed control points,
# smoothed). The narrow blob hugs the walk; the wide blob covers most of the
# graph -- and on the right it bulges around the far side to reach d.
BLOB_NARROW_LEFT = [
    (-0.32, 1.18), (0.14, 1.10), (0.42, 0.62), (0.62, 0.20),
    (0.58, -0.18), (0.50, -0.52), (0.10, -0.56), (-0.28, -0.52),
    (-0.62, -0.30), (-0.56, 0.14), (-0.52, 0.48),
]
BLOB_NARROW_RIGHT = [
    (-0.32, 1.18), (0.14, 1.10), (0.42, 0.60), (0.62, 0.20),
    (0.42, 0.02), (0.00, -0.08), (-0.28, -0.48), (-0.62, -0.32),
    (-0.56, 0.14), (-0.52, 0.48),
]
BLOB_WIDE = [
    (-0.34, 1.22), (0.20, 1.16), (0.72, 0.86), (1.02, 0.30),
    (1.00, -0.36), (0.90, -0.84), (0.30, -0.96), (-0.36, -0.94),
    (-0.92, -0.76), (-1.00, -0.10), (-0.90, 0.50), (-0.72, 0.92),
]


def chaikin(points, iters=4):
    pts = np.asarray(points, dtype=float)
    for _ in range(iters):
        nxt = np.empty((2 * len(pts), 2))
        rolled = np.roll(pts, -1, axis=0)
        nxt[0::2] = 0.75 * pts + 0.25 * rolled
        nxt[1::2] = 0.25 * pts + 0.75 * rolled
        pts = nxt
    return pts


def draw_panel(ax, cx, cy, s, edges, narrow_blob, returned, title, subtitle,
               dropped=()):
    def T(p):
        return (cx + s * p[0], cy + s * p[1])

    # graph edges
    for u, v in edges:
        (x0, y0), (x1, y1) = T(NODES[u]), T(NODES[v])
        ax.plot([x0, x1], [y0, y1], color=EDGE, linewidth=1.1,
                linestyle=(0, (2, 2)), zorder=1)

    # visited-set outlines
    for blob, lw in ((BLOB_WIDE, 1.6), (narrow_blob, 1.6)):
        pts = chaikin([T(p) for p in blob])
        ax.add_patch(Polygon(pts, closed=True, facecolor="none",
                             edgecolor=INK, linewidth=lw,
                             linestyle=(0, (1.5, 2.5)), zorder=2))

    # blob labels
    for blob, label in ((narrow_blob, "hnsw_ef=16"), (BLOB_WIDE, "hnsw_ef=512")):
        # anchor the label at the blob's lowest control point
        bx, by = min(blob, key=lambda p: p[1])
        x, y = T((bx, by))
        y -= 0.16
        ax.text(x, y, label, fontsize=15, color=INK, family=MONO,
                ha="center", va="center", zorder=7,
                bbox=dict(boxstyle="round,pad=0.30", facecolor=CARD,
                          edgecolor=EDGE, linewidth=0.8))

    # orange entry walk
    wx = [T(NODES[n])[0] for n in WALK]
    wy = [T(NODES[n])[1] for n in WALK]
    ax.plot(wx, wy, color=ORANGE, linewidth=2.6, linestyle=(0, (4, 3)),
            zorder=3, solid_capstyle="round")

    # nodes
    for name, p in NODES.items():
        x, y = T(p)
        if name == "q":
            continue
        if name in returned:
            ring, fill = returned[name]
            ax.add_patch(Circle((x, y), 0.155, facecolor=fill, edgecolor=ring,
                                linewidth=3.2, zorder=4))
            ax.add_patch(Circle((x, y), 0.058, facecolor=INK,
                                edgecolor="none", zorder=5))
        elif name in dropped:
            # was in the ef=16 top 3; the nearer neighbor displaced it
            ax.add_patch(Circle((x, y), 0.155, facecolor="none",
                                edgecolor=EDGE, linewidth=3.2,
                                linestyle=(0, (1.5, 1.5)), zorder=4))
            ax.add_patch(Circle((x, y), 0.058, facecolor=INK,
                                edgecolor="none", zorder=5))
            ax.text(x - 0.24, y + 0.10, "dropped", fontsize=13, color=INK,
                    family=MONO, ha="right", va="center", zorder=7,
                    bbox=dict(boxstyle="round,pad=0.15", facecolor=CARD,
                              edgecolor="none"))
        elif name == "e":
            ax.add_patch(Circle((x, y), 0.085, facecolor=ORANGE,
                                edgecolor="none", zorder=4))
        else:
            ax.add_patch(Circle((x, y), 0.066, facecolor=INK,
                                edgecolor="none", zorder=4))

    # query cross
    qx, qy = T(NODES["q"])
    r = 0.10
    for sign in (1, -1):
        ax.plot([qx - r, qx + r], [qy - sign * r, qy + sign * r], color=TEAL,
                linewidth=3.6, zorder=6, solid_capstyle="round")
    ax.text(qx - 0.20, qy, "query", fontsize=15, color=INK, family=MONO,
            ha="right", va="center", zorder=7)
    ex, ey = T(NODES["e"])
    ax.text(ex + 0.20, ey, "entry", fontsize=15, color=INK, family=MONO,
            ha="left", va="center", zorder=7,
            bbox=dict(boxstyle="round,pad=0.15", facecolor=CARD,
                      edgecolor="none"))

    ax.text(cx, cy + s * 1.42, title, fontsize=19, color=INK, family=MONO,
            ha="center", va="center", weight="bold", zorder=7)
    ax.text(cx, cy - s * 1.32, subtitle, fontsize=14.5, color=INK,
            family=MONO, ha="center", va="center", zorder=7)


def main():
    fig = plt.figure(figsize=(9.2, 7.2))
    fig.patch.set_facecolor(BACKGROUND)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 9.2)
    ax.set_ylim(0, 7.2)
    ax.set_aspect("equal")
    ax.axis("off")

    ax.add_patch(FancyBboxPatch((0.35, 0.35), 8.5, 6.5,
                                boxstyle="round,pad=0.02,rounding_size=0.18",
                                facecolor=CARD, edgecolor="none", zorder=0))

    # One graph. The narrow walk never reaches d, which is the node closest to
    # the query; the wider walk does, and d displaces c in the same three
    # results.
    draw_panel(
        ax, 4.6, 3.5, 2.5, EDGES_RIGHT, BLOB_NARROW_RIGHT,
        returned={"a": (TEAL, TEAL_FILL), "b": (TEAL, TEAL_FILL),
                  "d": (ORANGE, ORANGE_FILL)},
        dropped={"c"},
        title="",
        subtitle="",
    )

    out = ("../../qdrant-landing/static/articles_data/candidate-depth/"
           "hnsw-ef-saturation.png")
    fig.savefig(out, dpi=200, facecolor=BACKGROUND)
    print("wrote", out)


if __name__ == "__main__":
    main()
