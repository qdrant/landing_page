"""The RAM article figure: what rescoring recovers at TurboQuant bits1.

Retention comes from e7/results/e7a.json and e7a_float32.json on the reporting
half of the query split, the same derivation verify_articles.py locks the
article's quality table against.
"""

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = (
    "/Users/dylanc/Documents/GitHub/landing_page/qdrant-landing/static/articles_data/"
    "when-your-collection-outgrows-ram/bits1-rescore-recovery.png"
)
QDRANT_RED = "#DC244C"
INK = "#383838"
MUTED = "#9AA0A6"

E7 = Path("e7")


def reported(cell, key, split):
    rows = [cell["per_query"][q][key] for q in split["report"] if q in cell["per_query"]]
    return sum(rows) / len(rows)


def main():
    split = json.loads((E7 / "cells.json").read_text())["e7a"]["query_split"]
    cells = {
        (c["storage"], c["rescore"], c["oversampling"]): c
        for c in json.loads((E7 / "results/e7a.json").read_text())["cells"]
    }
    float32 = reported(json.loads((E7 / "results/e7a_float32.json").read_text()), "retention", split)

    keys = [("turbo_bits1", False, None), ("turbo_bits1", True, 1.0),
            ("turbo_bits1", True, 2.0), ("turbo_bits1", True, 4.0)]
    retention = [reported(cells[k], "retention", split) for k in keys]
    labels = ["off", "on ×1", "on ×2", "on ×4"]
    x = range(len(labels))

    figure, axes = plt.subplots(figsize=(10, 3.6), dpi=160)
    figure.patch.set_facecolor("white")
    axes.set_facecolor("white")

    axes.axhline(float32, color=MUTED, linewidth=1.4, linestyle="--", zorder=2)
    axes.text(0.02, float32 - 0.012, f"float32, no quantization ({float32:.3f})",
              color=INK, fontsize=8.5, ha="left", va="top")

    axes.plot(x, retention, color=QDRANT_RED, linewidth=2, marker="o", markersize=6, zorder=3)
    for xi, value in zip(x, retention):
        axes.annotate(f"{value:.3f}", (xi, value), textcoords="offset points",
                      xytext=(0, -14) if xi == 0 else (0, 8),
                      ha="center", color=INK, fontsize=8.5, zorder=4)

    axes.set_xticks(list(x))
    axes.set_xticklabels(labels)
    axes.set_xlabel("rescore, with oversampling", color=INK)
    axes.set_ylabel("share of the exact top 10", color=INK)
    axes.set_title("At bits1, one rescoring pass recovers most of the exact top 10",
                   color=INK, fontsize=13, pad=12)
    axes.set_ylim(0.55, 1.03)
    axes.set_xlim(-0.25, 3.25)
    axes.grid(axis="y", color=MUTED, alpha=0.25, linewidth=0.8, zorder=0)
    axes.set_axisbelow(True)
    for side in ("top", "right"):
        axes.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        axes.spines[side].set_color(MUTED)
    axes.tick_params(colors=INK, labelsize=9)

    figure.tight_layout()
    figure.savefig(OUT, facecolor="white")
    print(f"wrote {OUT}")
    print("retention:", [round(v, 3) for v in retention], "float32:", round(float32, 3))


if __name__ == "__main__":
    main()
