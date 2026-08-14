"""The E7 cell list, pre-registered before the first run.

Section 8 fixes these cells and forbids post-hoc additions, so they live in
one file that writes itself into the artifact. `python e7_cells.py` prints the
registration and writes `e7/cells.json`; the runner reads the same lists, so a
cell that is not here cannot be run.

Storage classes are named for what a reader would set, and every quantized
cell names its quantized placement, because leaving it at the default moves it
whenever the originals move (section 6: `pinned` beside in-RAM storage, `cold`
beside on-disk storage).
"""

from __future__ import annotations

import json

from qdrant_client import models

from e7 import E7, _write

HNSW_EF = 128
# The query asks for the series' candidate depth, not for ten results, because
# that is what sets the size of the disk read: a rescore rereads oversampling
# times the stage's limit in original vectors. A reader's dense prefetch fetches
# 200 candidates (section 9), so rescoring rereads 200 to 800 originals per
# query. Asking for 10 would have measured a twentieth of that and understated
# the whole finding. Metrics still report at rank 10.
DEPTH = 200
METRIC_AT = 10
REREAD_PER_QUERY = {over: int(DEPTH * over) for over in (1.0, 2.0, 4.0)}

# --------------------------------------------------------------- E7a, quality

def storage_config(name: str, quantized: str = "pinned"):
    """The quantization config for a storage class, with its placement written
    in. Quantized placement is a parameter rather than a constant because E7b
    moves it, and a config that hard-coded `pinned` would label a cell
    `cold_cached` while running `cold_pinned`."""
    memory = models.Memory(quantized)
    if name == "float32":
        return None
    if name == "int8":
        return models.ScalarQuantization(
            scalar=models.ScalarQuantizationConfig(
                type=models.ScalarType.INT8, quantile=0.99, memory=memory
            )
        )
    bits = {"turbo_bits4": models.TurboQuantBitSize.BITS4,
            "turbo_bits1": models.TurboQuantBitSize.BITS1}[name]
    return models.TurboQuantization(
        turbo=models.TurboQuantQuantizationConfig(bits=bits, memory=memory)
    )


def originals_config(originals: str):
    """Dense vector storage placement. `pinned` is rejected by the server's
    validators on this structure, so only `cached` and `cold` appear."""
    if originals not in ("cached", "cold"):
        raise ValueError(f"{originals} is not a placement dense storage accepts")
    return {"dense": models.VectorParamsDiff(memory=models.Memory(originals))}


STORAGE = ("float32", "int8", "turbo_bits4", "turbo_bits1")

OVERSAMPLING = (1.0, 2.0, 4.0)


def quality_cells() -> list[dict]:
    """float32 once, and every quantized class with rescore off and rescore on
    at each oversampling. float32 has no quantized shortlist to repair, so it
    gets no rescore cells."""
    cells = [{"storage": "float32", "rescore": None, "oversampling": None}]
    for storage in ("int8", "turbo_bits4", "turbo_bits1"):
        cells.append({"storage": storage, "rescore": False, "oversampling": None})
        for over in OVERSAMPLING:
            cells.append({"storage": storage, "rescore": True, "oversampling": over})
    return cells


# The rule that turns the cells into one recommendation, declared here so it
# cannot be chosen after the numbers land. Tolerances rather than an interval
# containing zero, because a wide interval would read "not detected" as
# "equivalent".
TOLERANCE = {"ndcg_at_10": 0.01, "exact_top10_retention": 0.02}

# Retention is defined here rather than described, because "how much of exact
# it kept" has three plausible readings and the article quotes one number.
RETENTION = (
    "|top-10 the cell returned, intersected with the top-10 of an exact=True float32 "
    "search on the same query| / 10, measured on the list the reader receives, which is "
    "after rescore where rescore is on. Ties inside the exact top-10 are kept as the "
    "server ordered them, since the intersection does not depend on their order."
)


def split() -> dict:
    """The half that selects and the half that reports, fixed before any run.

    Query ids sorted, then split at seed 42, so the membership is reproducible
    from this file alone and cannot be redrawn once results exist.
    """
    import numpy as np
    import pandas as pd

    from e7 import QUERIES

    ids = sorted(str(q) for q in pd.read_parquet(QUERIES)["query_id"])
    order = np.random.default_rng(42).permutation(len(ids))
    half = len(ids) // 2
    return {
        "seed": 42,
        "select": sorted(ids[i] for i in order[:half]),
        "report": sorted(ids[i] for i in order[half:]),
    }

# ------------------------------------------------------------- E7b, placement

PLACEMENTS = [
    {"name": "cached_pinned", "originals": "cached", "quantized": "pinned"},
    {"name": "cold_pinned", "originals": "cold", "quantized": "pinned"},
    {"name": "cold_cached", "originals": "cold", "quantized": "cached"},
]

# 12 GiB, not the 10 GiB first proposed: 10 GiB holds the settled collection
# but not its build, which hit that ceiling during the ingest.
LIMITS = {"fits": "12g", "exceeds": "4g"}


# Six cells run three times each, rather than twelve run once. Twelve
# single-pass cells on a laptop VM manufacture more precision than the machine
# supports, and the rows that would have been cut are the symmetric ones that
# do not change what a reader does: rescore off at a placement whose whole
# point is what rescore reads. Spread across independent starts is the honest
# error bar here, so repeats buy more than rows. Decided before any E7b cell
# ran, on measurement-validity grounds rather than on any E7b result.
REPEATS = 3

PLACEMENT_CELLS = [
    # The no-pressure reference, and what rescore costs when everything fits.
    {"regime": "fits", "originals": "cached", "quantized": "pinned", "rescore": False},
    {"regime": "fits", "originals": "cached", "quantized": "pinned", "rescore": True},
    # The operational test: is rescore still worth it at the limit you run at.
    {"regime": "exceeds", "originals": "cached", "quantized": "pinned", "rescore": False},
    {"regime": "exceeds", "originals": "cached", "quantized": "pinned", "rescore": True},
    # Whether caching the originals is necessary once rescore is on.
    {"regime": "exceeds", "originals": "cold", "quantized": "pinned", "rescore": True},
    # What not pinning the structure the search itself reads costs.
    {"regime": "exceeds", "originals": "cold", "quantized": "cached", "rescore": True},
]


def placement_cells() -> list[dict]:
    """The six retained placement cells, each carrying its limit and its role."""
    return [
        {
            **cell,
            "placement": f"{cell['originals']}_{cell['quantized']}",
            "limit": LIMITS[cell["regime"]],
            "control": not cell["rescore"],
        }
        for cell in PLACEMENT_CELLS
    ]


def cold_start_cells() -> list[dict]:
    """Every cell now starts cold by protocol, so the cold-start arm is not a
    separate matrix. What replaces it is the spread across repeated independent
    starts, which is the error bar the article reports."""
    return [c for c in placement_cells() if c["originals"] == "cold"]


def register() -> dict:
    quality, placement, cold = quality_cells(), placement_cells(), cold_start_cells()
    halves = split()
    return {
        "registered": "pre-run, section 8 forbids additions after this file is written",
        "held_fixed": {
            "hnsw_ef": HNSW_EF,
            "candidate_depth": DEPTH,
            "metrics_at": METRIC_AT,
            "originals_reread_per_query": REREAD_PER_QUERY,
        },
        "e7a": {
            "cells": quality,
            "count": len(quality),
            "storage_classes": list(STORAGE),
            "retention_definition": RETENTION,
            "oversampling": list(OVERSAMPLING),
            "decision_rule": (
                "smallest storage class whose held-out nDCG@10 is within "
                f"{TOLERANCE['ndcg_at_10']} of float32 and whose exact top-10 retention is "
                f"within {TOLERANCE['exact_top10_retention']}; at that class the lowest "
                "oversampling clearing both. Selection on one query half, reporting on the "
                "other. If no cell clears, the rule returns nothing and the article routes "
                "the reader to a larger class, more candidate depth, or an accepted loss."
            ),
            "tolerance": TOLERANCE,
            "query_split": halves,
        },
        "e7b": {
            "cells": placement,
            "count": len(placement),
            "repeats": REPEATS,
            "runs_total": len(placement) * REPEATS,
            "cold_start_cells": cold,
            "cold_start_count": len(cold),
            "reported_statistic": (
                "paired relative change within a cell pair, with p50, p95 and the spread "
                "across independent starts. Absolute milliseconds ship as evidence for one "
                "stated machine, never as a target a reader compares against."
            ),
            "limits": LIMITS,
            "negative_control": (
                "the rescore=False rows. Moving originals between cached and cold with no "
                "reread should not move latency; if it does, the cold rows carry no claim."
            ),
            "reported_arm": (
                "warmed. Every cell starts from a controlled cache state and takes the same "
                "fixed warm-up pass before its measured pass. Settings are not randomized "
                "inside one long-lived container: under a tight limit the previous cell's "
                "pages decide which of this cell's pages survive."
            ),
            "per_cell_protocol": [
                "stop the container",
                "sync, drop the VM page cache, verify it fell to its floor",
                "start a fresh container at the cell's limit",
                "wait for green",
                "apply the cell's storage class and placements, wait for green again",
                "one fixed warm-up pass at the cell's depth",
                "the measured pass",
                "record memory, io.stat and timings, then stop",
            ],
        },
    }


if __name__ == "__main__":
    payload = register()
    _write(E7 / "cells.json", payload)
    print(json.dumps({k: v.get("count") for k, v in payload.items() if isinstance(v, dict)}, indent=1))
