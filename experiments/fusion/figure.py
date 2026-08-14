"""The article figure: how much of a prefetch's top-10 mass each rank gets, at k=2 and k=61.

Contributions come from harness.replay.position_scores, the port that Gate A
checks against the Rust, so the picture and the engine agree by construction.
"""

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from harness.replay import position_scores

OUT = (
    "/Users/dylanc/Documents/GitHub/landing_page/qdrant-landing/static/articles_data/"
    "how-to-tune-hybrid-search/rrf-k-rank-weight.png"
)
QDRANT_RED = "#DC244C"
BLUE = "#3B6FD4"
INK = "#383838"
MUTED = "#9AA0A6"
RANKS = 10


def share(k: int) -> np.ndarray:
    contributions = position_scores(RANKS, k, 1.0).astype(np.float64)
    return contributions / contributions.sum()


def main():
    low, high = share(2), share(61)
    positions = np.arange(1, RANKS + 1)
    width = 0.38

    figure, axes = plt.subplots(figsize=(10, 4.6), dpi=160)
    figure.patch.set_facecolor("white")
    axes.set_facecolor("white")

    for offset, (values, color, label) in enumerate(
        ((low, QDRANT_RED, "k = 2  (Qdrant default)"), (high, BLUE, "k = 61  (the ported value)"))
    ):
        axes.bar(
            positions + (offset - 0.5) * width,
            values * 100,
            width=width * 0.92,
            color=color,
            label=label,
            zorder=3,
        )

    axes.set_xticks(positions)
    axes.set_xlabel("rank within one prefetch", color=INK)
    axes.set_ylabel("share of the prefetch's top-10 score mass (%)", color=INK)
    axes.set_title(
        "How much a rank is worth under RRF, at two values of k", color=INK, fontsize=13, pad=12
    )
    axes.set_ylim(0, 28)
    axes.grid(axis="y", color=MUTED, alpha=0.25, linewidth=0.8, zorder=0)
    axes.set_axisbelow(True)
    for side in ("top", "right"):
        axes.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        axes.spines[side].set_color(MUTED)
    axes.tick_params(colors=INK, labelsize=9)
    axes.legend(frameon=False, loc="upper right", fontsize=10, labelcolor=INK)

    figure.tight_layout()
    figure.savefig(OUT, facecolor="white")
    print(f"wrote {OUT}")
    print(f"k=2  rank 1 {low[0]:.3%}  rank 10 {low[-1]:.3%}  ratio {low[0] / low[-1]:.2f}x")
    print(f"k=61 rank 1 {high[0]:.3%} rank 10 {high[-1]:.3%}  ratio {high[0] / high[-1]:.2f}x")


if __name__ == "__main__":
    main()
