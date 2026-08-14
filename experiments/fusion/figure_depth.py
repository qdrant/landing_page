"""The depth article figure: best possible against current score across the depth sweep.

Values come from study/e3_breadth.json, the same artifact verify_articles.py
locks the article's endpoint table against, so the picture and the table agree
by construction.
"""

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = (
    "/Users/dylanc/Documents/GitHub/landing_page/qdrant-landing/static/articles_data/"
    "candidate-depth/depth-ceiling-vs-current.png"
)
QDRANT_RED = "#DC244C"
BLUE = "#2F6FF0"
INK = "#383838"
MUTED = "#9AA0A6"

# Article table order, with the article's display names.
CORPORA = [
    ("scifact", "SciFact"),
    ("arguana", "ArguAna"),
    ("wands", "WANDS"),
    ("codesearchnet", "CodeSearchNet"),
    ("dbpedia-entity", "DBPedia-entity"),
]


def sweep(block):
    rows = sorted(
        (r for name, r in block["settings"].items() if name.startswith("ef128_depth")),
        key=lambda r: r["depth"],
    )
    depths = [r["depth"] for r in rows]
    return depths, [r["ceiling_ndcg_10"] for r in rows], [r["default_ndcg_10"] for r in rows]


def main():
    data = json.loads(Path("study/e3_breadth.json").read_text())

    figure, panels = plt.subplots(1, 5, figsize=(10, 2.9), dpi=160, sharey=True)
    figure.patch.set_facecolor("white")

    for axes, (corpus, label) in zip(panels, CORPORA):
        depths, ceiling, current = sweep(data[corpus])
        axes.set_facecolor("white")
        axes.fill_between(depths, current, ceiling, color=QDRANT_RED, alpha=0.06, zorder=1)
        axes.plot(depths, ceiling, color=QDRANT_RED, linewidth=2, marker="o",
                  markersize=3.5, zorder=3)
        axes.plot(depths, current, color=BLUE, linewidth=2, marker="s",
                  markersize=3.5, zorder=3)
        axes.set_xscale("log")
        axes.set_xticks([10, 50, 200, 500])
        axes.set_xticklabels(["10", "50", "200", "500"])
        axes.minorticks_off()
        axes.set_title(label, color=INK, fontsize=9.5, pad=6)
        axes.set_ylim(0.4, 1.03)
        axes.grid(axis="y", color=MUTED, alpha=0.25, linewidth=0.8, zorder=0)
        axes.set_axisbelow(True)
        for side in ("top", "right"):
            axes.spines[side].set_visible(False)
        for side in ("left", "bottom"):
            axes.spines[side].set_color(MUTED)
        axes.tick_params(colors=INK, labelsize=8)

    # Direct labels on the first panel, once for the whole row.
    first = panels[0]
    first.set_ylabel("nDCG@10", color=INK, fontsize=9)
    first.text(11, 0.985, "best possible", color=QDRANT_RED, fontsize=8.5, va="bottom")
    first.text(11, 0.655, "current score", color=BLUE, fontsize=8.5, va="top")

    figure.suptitle(
        "More depth raises the best possible score far more than the current one",
        color=INK, fontsize=12, y=1.02,
    )
    figure.supxlabel("prefetch limit", color=INK, fontsize=9, y=-0.04)
    figure.tight_layout()
    figure.savefig(OUT, facecolor="white", bbox_inches="tight")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
