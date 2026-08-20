"""The article figure: what each fusion method does to the spacing between scores.

Two panels, three number lines each, same four documents and the same numbers as
figure_fusion_signals.py. RRF reads only positions, so its two rows sit on evenly
spaced rank slots and the dense list's wide lead disappears. DBSF rescales each
list affinely onto one axis, so the raw spacing survives, and the two fused lines
disagree about first place.
"""

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

OUT = (
    "/Users/dylanc/Documents/GitHub/landing_page/qdrant-landing/static/articles_data/"
    "how-to-tune-hybrid-search/fusion-signals.png"
)
QDRANT_RED = "#DC244C"
BLUE = "#3B6FD4"
INK = "#383838"
MUTED = "#9AA0A6"

DOCS = ["A", "B", "C", "D"]
DENSE = {"A": 0.91, "B": 0.62, "C": 0.58, "D": 0.55}
SPARSE = {"A": 13.6, "B": 14.8, "C": 14.1, "D": 12.9}
PREFETCHES = (("dense", DENSE, QDRANT_RED), ("sparse", SPARSE, BLUE))
K = 2  # Qdrant's default RRF constant.


def ranked(scores):
    return sorted(DOCS, key=lambda doc: -scores[doc])


def rrf_parts():
    """Qdrant scores a candidate at 1 / ((pos + 1) / weight + k - 1), weight 1."""
    return {
        name: {doc: 1.0 / ((pos + 1) / 1.0 + K - 1) for pos, doc in enumerate(ranked(scores))}
        for name, scores, _ in PREFETCHES
    }


def dbsf_parts():
    """Qdrant rescales each prefetch to (score - (mean - 3s)) / 6s, s = std(ddof=1)."""
    parts = {}
    for name, scores, _ in PREFETCHES:
        values = np.array([scores[doc] for doc in DOCS], dtype=np.float64)
        mean, spread = values.mean(), values.std(ddof=1)
        parts[name] = dict(zip(DOCS, (values - (mean - 3 * spread)) / (6 * spread)))
    return parts


def summed(parts):
    return {doc: parts["dense"][doc] + parts["sparse"][doc] for doc in DOCS}


def rank_slots(scores):
    """Evenly spaced slots, rank 1 on the right, so the spacing carries nothing."""
    order = ranked(scores)
    return {doc: (len(order) - 1 - pos) / (len(order) - 1) for pos, doc in enumerate(order)}


def number_line(axes, row, name, values, color, low, high, notes=None, ring=None, ms=8):
    """One horizontal line with a labeled dot per document, higher score to the right."""
    axes.plot([-0.03, 1.03], [row, row], color=MUTED, lw=0.9, zorder=1)
    axes.text(-0.08, row, name, ha="right", va="center", color=INK, fontsize=10)
    for doc, value in values.items():
        x = (value - low) / (high - low)
        axes.plot(x, row, "o", ms=ms, color=color, zorder=3)
        axes.text(x, row + 0.17, doc, ha="center", va="bottom", color=INK, fontsize=10)
        if notes and doc in notes:
            axes.text(x, row - 0.2, notes[doc], ha="center", va="top", color=MUTED, fontsize=8.5)
        if doc == ring:
            axes.plot(x, row, "o", ms=ms * 2.0, mfc="none", mec=INK, mew=1.0, zorder=4)


def extremes(values, scores):
    """The raw score of the lowest and highest dot on a rescaled row."""
    order = ranked(values)
    return {order[0]: f"{scores[order[0]]:g}", order[-1]: f"{scores[order[-1]]:g}"}


def panel(axes, name, rows, fused, shared_axis):
    for row, (label, values, color, notes) in zip((2, 1), rows):
        low, high = shared_axis or (min(values.values()), max(values.values()))
        number_line(axes, row, label, values, color, low, high, notes=notes)
    winner = max(fused, key=fused.get)
    # The result sits lower, so it reads as the output of the two rows above.
    number_line(
        axes, -0.35, "fused", fused, INK,
        min(fused.values()), max(fused.values()), ring=winner,
    )
    axes.set_xlim(-0.27, 1.07)
    axes.set_ylim(-0.95, 2.55)
    axes.set_xticks([])
    axes.set_yticks([])
    for side in axes.spines:
        axes.spines[side].set_visible(False)
    axes.set_title(name, color=INK, fontsize=11, loc="left", pad=10)
    return winner


def main():
    rrf, dbsf = rrf_parts(), dbsf_parts()
    rrf_fused, dbsf_fused = summed(rrf), summed(dbsf)
    figure = plt.figure(figsize=(10.6, 3.5), dpi=160)
    figure.patch.set_facecolor("white")
    grid = figure.add_gridspec(1, 2, wspace=0.13, left=0.055, right=0.985, top=0.86, bottom=0.06)

    rrf_winner = panel(
        figure.add_subplot(grid[0]), f"RRF  k={K}",
        [("dense", rank_slots(DENSE), QDRANT_RED,
          {doc: str(pos + 1) for pos, doc in enumerate(ranked(DENSE))}),
         ("sparse", rank_slots(SPARSE), BLUE,
          {doc: str(pos + 1) for pos, doc in enumerate(ranked(SPARSE))})],
        rrf_fused, (0.0, 1.0),
    )
    axis = (min(min(part.values()) for part in dbsf.values()),
            max(max(part.values()) for part in dbsf.values()))
    dbsf_winner = panel(
        figure.add_subplot(grid[1]), "DBSF",
        [("dense", dbsf["dense"], QDRANT_RED, extremes(dbsf["dense"], DENSE)),
         ("sparse", dbsf["sparse"], BLUE, extremes(dbsf["sparse"], SPARSE))],
        dbsf_fused, axis,
    )

    figure.add_artist(plt.Line2D([0.513, 0.513], [0.06, 0.9], color=MUTED, lw=0.9, alpha=0.45))

    assert rrf_winner != dbsf_winner, "the two branches must disagree on first place"
    figure.savefig(OUT, facecolor="white")
    print(f"wrote {OUT}")
    for doc in DOCS:
        print(f"{doc}: rrf {rrf_fused[doc]:.4f}  dbsf {dbsf_fused[doc]:.4f}")
    print("RRF  fused order:", sorted(DOCS, key=lambda d: -rrf_fused[d]))
    print("DBSF fused order:", sorted(DOCS, key=lambda d: -dbsf_fused[d]))


if __name__ == "__main__":
    main()
