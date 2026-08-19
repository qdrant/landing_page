"""The reranker article figure: best gain over tuned fusion across candidate counts.

Values come from study/e4_reranking.json, the same artifact the article's
tables are built from, so the picture and the prose agree by construction.
"""

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = (
    "/Users/dylanc/Documents/GitHub/landing_page/qdrant-landing/static/articles_data/"
    "when-a-reranker-is-worth-it/reranker-gain-by-candidate-count.png"
)
QDRANT_RED = "#DC244C"
INK = "#383838"
MUTED = "#9AA0A6"

COUNTS = [10, 25, 50, 100, 200]
CORPORA = [
    ("scifact", "SciFact"),
    ("arguana", "ArguAna"),
    ("wands", "WANDS"),
    ("codesearchnet", "CodeSearchNet"),
    ("dbpedia-entity", "DBPedia-entity"),
]


def best_per_count(entry):
    values = []
    for count in COUNTS:
        values.append(
            max(
                v["vs_best_fusion_arm"]
                for key, v in entry["configurations"].items()
                if key.endswith(f"@{count}")
            )
        )
    return values


def main():
    data = json.loads(Path("study/e4_reranking.json").read_text())

    figure, panels = plt.subplots(1, 5, figsize=(10, 2.9), dpi=160, sharey=True)
    figure.patch.set_facecolor("white")

    for axes, (corpus, label) in zip(panels, CORPORA):
        gains = best_per_count(data[corpus])
        axes.set_facecolor("white")
        axes.axhline(0, color=MUTED, linewidth=1.2, linestyle=(0, (4, 3)), zorder=2)
        axes.fill_between(COUNTS, 0, gains, color=QDRANT_RED, alpha=0.06, zorder=1)
        axes.plot(COUNTS, gains, color=QDRANT_RED, linewidth=2, marker="o",
                  markersize=3.5, zorder=3)
        axes.set_xscale("log")
        axes.set_xticks(COUNTS)
        axes.set_xticklabels([str(c) for c in COUNTS])
        axes.minorticks_off()
        axes.set_title(label, color=INK, fontsize=9.5, pad=6)
        axes.set_ylim(-0.05, 0.15)
        axes.grid(axis="y", color=MUTED, alpha=0.25, linewidth=0.8, zorder=0)
        axes.set_axisbelow(True)
        for side in ("top", "right"):
            axes.spines[side].set_visible(False)
        for side in ("left", "bottom"):
            axes.spines[side].set_color(MUTED)
        axes.tick_params(colors=INK, labelsize=8)

    first = panels[0]
    first.set_ylabel("nDCG@10 change", color=INK, fontsize=9)
    first.text(11, -0.008, "tuned fusion", color=MUTED, fontsize=8.5, va="top")
    first.text(11, 0.042, "best reranker", color=QDRANT_RED, fontsize=8.5, va="bottom")

    figure.suptitle(
        "A higher candidate count refines a win and rescues no loss",
        color=INK, fontsize=12, y=1.02,
    )
    figure.supxlabel("candidate count", color=INK, fontsize=9, y=-0.04)
    figure.tight_layout()
    figure.savefig(OUT, facecolor="white", bbox_inches="tight")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
