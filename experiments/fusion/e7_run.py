"""Run the pre-registered E7 cells.

`e7_cells.py` owns what runs; this file owns how. A cell that is not in the
registration cannot be run from here, and every result carries the memory and
block-read evidence that says whether its regime was real.

    python e7_run.py exact      the float32 exact reference, once
    python e7_run.py e7a        quality, 13 cells at the default placement
    python e7_run.py e7b [n]    placement and latency, 6 cells x n rounds, resumable
    python e7_run.py decide     apply the registered rule to the E7a results

E7a runs at one placement because quality does not depend on it. E7b changes
the container between cells, because page cache carries between them otherwise
and the limit stops meaning anything (see `e7.cold`).
"""

from __future__ import annotations

import json
import sys
import time

import numpy as np
import pandas as pd
from qdrant_client import models

import e7
import e7_cells as cells
from harness import metrics as M

RESULTS = e7.E7 / "results"
RESULTS.mkdir(parents=True, exist_ok=True)


def _queries() -> tuple[list[str], np.ndarray]:
    frame = pd.read_parquet(e7.QUERIES)
    return [str(q) for q in frame["query_id"]], np.load(e7.QDENSE)


def _qrels() -> dict:
    """Qrels keyed by point id, which is what the server returns."""
    qrels = pd.read_parquet(e7.QRELS)
    docs = pd.read_parquet(e7.DOCS, columns=["point_id", "doc_id"])
    lookup = dict(zip(docs["doc_id"], docs["point_id"]))
    qrels = qrels[qrels["doc_id"].isin(lookup)].copy()
    qrels["point_id"] = [lookup[d] for d in qrels["doc_id"]]
    return M.qrels_dict(qrels)


def _search(conn, vector, rescore, oversampling, exact=False, ignore=False) -> tuple[list[int], float]:
    quant = None
    if ignore:
        # The only way to score a graph search against the originals while a
        # quantized copy exists: clearing the collection config does not do it,
        # because the search reads the quantized storage off the segment.
        quant = models.QuantizationSearchParams(ignore=True)
    elif rescore is not None:
        quant = models.QuantizationSearchParams(rescore=rescore, oversampling=oversampling)
    params = models.SearchParams(hnsw_ef=cells.HNSW_EF, exact=exact, quantization=quant)
    at = time.time()
    points = conn.query_points(
        e7.COLLECTION,
        query=vector.tolist(),
        using="dense",
        limit=cells.DEPTH,
        search_params=params,
    ).points
    return [int(p.id) for p in points], time.time() - at


def _pass(conn, query_ids, vectors, rescore=None, oversampling=None, exact=False, ignore=False) -> dict:
    runs, latencies = {}, []
    for qid, vector in zip(query_ids, vectors):
        ids, seconds = _search(conn, vector, rescore, oversampling, exact, ignore)
        runs[qid] = ids
        latencies.append(seconds)
    ordered = sorted(latencies)
    return {
        "runs": {q: v[: cells.DEPTH] for q, v in runs.items()},
        "latency_ms": {
            "mean": round(1000 * float(np.mean(latencies)), 3),
            "p50": round(1000 * ordered[len(ordered) // 2], 3),
            "p95": round(1000 * ordered[int(len(ordered) * 0.95)], 3),
            "max": round(1000 * ordered[-1], 3),
        },
    }


# ------------------------------------------------------------------- reference


def exact() -> None:
    """Brute-force top-k on float32, so every cell's loss splits into what the
    graph missed and what the quantized ranking then reordered."""
    e7.cold(cells.LIMITS["fits"])
    conn = e7._client()
    conn.update_collection(e7.COLLECTION, quantization_config=None)
    _settle(conn)
    query_ids, vectors = _queries()
    started = time.time()
    result = _pass(conn, query_ids, vectors, exact=True)
    e7._write(
        RESULTS / "exact.json",
        {
            "reference": "exact=True on float32, no quantization",
            "depth": cells.DEPTH,
            "queries": len(query_ids),
            "seconds": round(time.time() - started, 1),
            "latency_ms": result["latency_ms"],
            "top10": {q: v[:10] for q, v in result["runs"].items()},
        },
    )


def _settle(conn, wait_seconds: int = 7200) -> None:
    deadline = time.time() + wait_seconds
    settled = 0
    while time.time() < deadline:
        info = conn.get_collection(e7.COLLECTION)
        optimising = str(info.optimizer_status) != "ok"
        if not optimising and (info.indexed_vectors_count or 0) >= info.points_count:
            settled += 1
            # Two clean reads thirty seconds apart, and readiness is a query
            # rather than the status field, which can sit at grey while the
            # shard is Active and serving.
            if settled >= 2:
                e7._wait_ready()
                return
        else:
            settled = 0
        time.sleep(30)
    raise SystemExit("collection did not settle")


# ------------------------------------------------------------------ E7a quality


def e7a() -> None:
    """Thirteen quality cells at one placement, grouped so each storage class
    is applied once and its rescore variants run against it."""
    reference = json.loads((RESULTS / "exact.json").read_text())["top10"]
    qrels = _qrels()
    query_ids, vectors = _queries()
    e7.cold(cells.LIMITS["fits"])
    conn = e7._client()

    out = []
    for storage in cells.STORAGE:
        applied = time.time()
        conn.update_collection(
            e7.COLLECTION, quantization_config=cells.storage_config(storage, "pinned")
        )
        _settle(conn)
        apply_seconds = round(time.time() - applied, 1)
        variants = [c for c in cells.quality_cells() if c["storage"] == storage]
        for cell in variants:
            result = _pass(conn, query_ids, vectors, cell["rescore"], cell["oversampling"])
            out.append(
                {
                    **cell,
                    "apply_seconds": apply_seconds,
                    "latency_ms": result["latency_ms"],
                    "per_query": _score(result["runs"], reference, qrels),
                }
            )
            print(f"  {storage} rescore={cell['rescore']} x{cell['oversampling']}", flush=True)
        e7.mem(f"e7a-{storage}")
    e7._write(RESULTS / "e7a.json", {"cells": out, "registered": len(cells.quality_cells())})


def _score(runs: dict, reference: dict, qrels: dict) -> dict:
    """nDCG@10 and retention against the exact top-10, per query.

    Retention is the registered definition: how much of the exact top-10 the
    cell's own top-10 kept, over 10.
    """
    scored = M.evaluate(qrels, {q: M.run_entry(ids) for q, ids in runs.items()})
    return {
        qid: {
            "ndcg_cut_10": round(scored.get(qid, {}).get("ndcg_cut_10", 0.0), 6),
            "retention": len(set(ids[:10]) & set(reference.get(qid, []))) / 10,
        }
        for qid, ids in runs.items()
    }


def decide() -> None:
    """The registered rule, applied to the held-out half only.

    The rule text is unchanged. Its float32 reference comes from
    `e7a_float32.json` when that file exists, because the float32 row inside
    `e7a.json` measured int8 without rescoring; see the `float32` task.
    """
    data = json.loads((RESULTS / "e7a.json").read_text())["cells"]
    split = json.loads((e7.E7 / "cells.json").read_text())["e7a"]["query_split"]
    corrected = RESULTS / "e7a_float32.json"
    if corrected.exists():
        base = json.loads(corrected.read_text())
        data = [c for c in data if c["storage"] not in ("float32", "int8")]
    else:
        base = next(c for c in data if c["storage"] == "float32")
    order = ["turbo_bits1", "turbo_bits4", "int8"]  # smallest storage class first

    def rows(cell, which, key):
        return np.array(
            [cell["per_query"][q][key] for q in split[which] if q in cell["per_query"]]
        )

    def half(cell, which):
        return float(rows(cell, which, "ndcg_cut_10").mean()), float(
            rows(cell, which, "retention").mean()
        )

    # Selection compares against float32 on the selection half and reporting
    # against float32 on the reporting half. Comparing a candidate's selection
    # half to float32's reporting half would mix the two, which is the thing
    # section 12 exists to prevent.
    picked, table = None, []
    sel_ref_ndcg, sel_ref_ret = half(base, "select")
    ref_ndcg, ref_ret = half(base, "report")
    for storage in order:
        variants = sorted(
            (c for c in data if c["storage"] == storage),
            key=lambda c: (c["oversampling"] or 0, c["rescore"] or False),
        )
        for cell in variants:
            sel_ndcg, sel_ret = half(cell, "select")
            clears = (
                sel_ref_ndcg - sel_ndcg <= cells.TOLERANCE["ndcg_at_10"]
                and sel_ref_ret - sel_ret <= cells.TOLERANCE["exact_top10_retention"]
            )
            table.append(
                {
                    "storage": storage,
                    "rescore": cell["rescore"],
                    "oversampling": cell["oversampling"],
                    "select_ndcg": round(sel_ndcg, 4),
                    "select_retention": round(sel_ret, 4),
                    "float32_select_ndcg": round(sel_ref_ndcg, 4),
                    "float32_select_retention": round(sel_ref_ret, 4),
                    "clears_on_select": clears,
                }
            )
            if clears and picked is None:
                report_ndcg, report_ret = half(cell, "report")
                # The held-out gap ships with a paired interval, and it is
                # reported whether or not it also clears the tolerance there.
                paired = M.bootstrap_interval(
                    rows(cell, "report", "ndcg_cut_10") - rows(base, "report", "ndcg_cut_10")
                )
                picked = {
                    "storage": storage,
                    "rescore": cell["rescore"],
                    "oversampling": cell["oversampling"],
                    "report_ndcg": round(report_ndcg, 4),
                    "report_retention": round(report_ret, 4),
                    "float32_report_ndcg": round(ref_ndcg, 4),
                    "float32_report_retention": round(ref_ret, 4),
                    "held_out_ndcg_gap": round(ref_ndcg - report_ndcg, 4),
                    "held_out_retention_gap": round(ref_ret - report_ret, 4),
                    "paired_ndcg_difference": {k: round(v, 5) for k, v in paired.items()},
                    "clears_on_report": (
                        ref_ndcg - report_ndcg <= cells.TOLERANCE["ndcg_at_10"]
                        and ref_ret - report_ret <= cells.TOLERANCE["exact_top10_retention"]
                    ),
                }
        if picked:
            break
    e7._write(
        RESULTS / "decision.json",
        {
            "rule": json.loads((e7.E7 / "cells.json").read_text())["e7a"]["decision_rule"],
            "selected": picked,
            "no_cell_clears": picked is None,
            "considered": table,
        },
    )


# ---------------------------------------------------------------- E7b placement


def e7b(repeats: str = None) -> None:
    """Twelve placement cells, each from its own controlled cache state.

    The deployment point comes from E7a's decision rather than from a choice
    made here, so the placement matrix runs the configuration the article
    recommends rather than one picked to suit it.
    """
    point = json.loads((RESULTS / "decision.json").read_text())["selected"]
    if point is None:
        raise SystemExit("no deployment point cleared the rule; E7b has nothing to run")
    reference = json.loads((RESULTS / "exact.json").read_text())["top10"]
    qrels = _qrels()
    query_ids, vectors = _queries()

    rounds = range(int(repeats) if repeats else cells.REPEATS)
    path = RESULTS / "e7b.json"
    out = json.loads(path.read_text())["runs"] if path.exists() else []
    done = {(r["round"], r["name"]) for r in out}

    for rnd in rounds:
        # Randomized order within a round, seeded by the round, so a round is a
        # complete replicate and no cell always follows the same neighbour.
        order = list(cells.placement_cells())
        np.random.default_rng(1000 + rnd).shuffle(order)
        for cell in order:
            name = f"{cell['regime']}-{cell['placement']}-rescore{cell['rescore']}"
            if (rnd, name) in done:
                continue
            started = time.time()
            # Configure first, at a limit with room for the optimizer pass a
            # placement change triggers, then measure in a fresh container at
            # the cell's own limit. Doing both in one container killed the
            # server at 12 GiB, and an optimizer pass inside the measured
            # window would have contaminated the latency anyway.
            verified = _configure(cell, point)
            e7.cold(cell["limit"])
            conn = e7._client()
            ready = time.time()
            before = e7.mem(f"e7b-r{rnd}-{name}-before")
            _pass(conn, query_ids, vectors, cell["rescore"], point["oversampling"])
            measured = _pass(conn, query_ids, vectors, cell["rescore"], point["oversampling"])
            after = e7.mem(f"e7b-r{rnd}-{name}-after")
            out.append(
                {
                    **cell,
                    "round": rnd,
                    "name": name,
                    "storage": point["storage"],
                    "verified_config": verified,
                    "oversampling": point["oversampling"],
                    "originals_reread_per_query": (
                        cells.REREAD_PER_QUERY.get(point["oversampling"] or 1.0)
                        if cell["rescore"]
                        else 0
                    ),
                    "latency_ms": measured["latency_ms"],
                    "quality": _summarise(_score(measured["runs"], reference, qrels)),
                    "setup_seconds": round(ready - started, 1),
                    "cell_seconds": round(time.time() - started, 1),
                    "host_swap_before": before["host"]["host_swap"],
                    "host_swap_after": after["host"]["host_swap"],
                    "memory_before": before,
                    "memory_after": after,
                }
            )
            # Written after every cell, so a run interrupted partway keeps what
            # it has and resumes at the cell it stopped on.
            e7._write(path, {"runs": out, "deployment_point": point, "repeats": cells.REPEATS})
            print(
                f"  round {rnd} {name}: {measured['latency_ms']['p50']} ms p50, "
                f"{round(time.time() - started)}s",
                flush=True,
            )


CONFIG_LIMIT = "14g"


def _configure(cell, point) -> dict:
    """Bring the collection to the cell's placement, on a roomy container."""
    e7.up(CONFIG_LIMIT)
    e7._wait_ready()
    verified = _apply(e7._client(), cell, point)
    return verified


def _apply(conn, cell, point) -> dict:
    """Set the cell's placements, and only when they are not already set.

    Two cells that differ only in the query-time `rescore` flag need the same
    collection config, and re-applying it starts an optimizer pass whose
    transient spike OOM-killed the server at the 12 GiB limit. Reading the
    config first is both safer and faster.
    """
    current = json.loads(conn.get_collection(e7.COLLECTION).config.model_dump_json())
    dense = (current.get("params", {}).get("vectors", {}) or {}).get("dense", {}) or {}
    quant = current.get("quantization_config") or {}
    inner = next(iter(quant.values()), {}) if quant else {}
    if dense.get("memory") != cell["originals"] or inner.get("memory") != cell["quantized"]:
        conn.update_collection(
            e7.COLLECTION,
            vectors_config=cells.originals_config(cell["originals"]),
            quantization_config=cells.storage_config(point["storage"], cell["quantized"]),
        )
        _settle(conn)
    # Read back and assert, so every run carries proof of the placement it
    # measured rather than the placement it asked for.
    current = json.loads(conn.get_collection(e7.COLLECTION).config.model_dump_json())
    dense = (current.get("params", {}).get("vectors", {}) or {}).get("dense", {}) or {}
    quant = current.get("quantization_config") or {}
    inner = next(iter(quant.values()), {}) if quant else {}
    verified = {"originals": dense.get("memory"), "quantized": inner.get("memory"),
                "quantization": quant}
    if verified["originals"] != cell["originals"] or verified["quantized"] != cell["quantized"]:
        raise SystemExit(f"asked for {cell['originals']}/{cell['quantized']}, got {verified}")
    return verified


def _summarise(per_query: dict) -> dict:
    return {
        "ndcg_cut_10": round(float(np.mean([v["ndcg_cut_10"] for v in per_query.values()])), 4),
        "retention": round(float(np.mean([v["retention"] for v in per_query.values()])), 4),
    }


def check() -> None:
    """Flag runs whose block reads disagree with their cell's other runs.

    Repeats are only worth their cost if they can be told apart from protocol
    failures, and the read volume does that: a cell that read half what its
    siblings read started from a cache that was not cold, and its latency is
    the artifact of that rather than a measurement of the cell.
    """
    runs = json.loads((RESULTS / "e7b.json").read_text())["runs"]

    def io(m):
        return int(m["cgroup"]["io.stat"].split()[1].split("=")[1])

    rows = []
    for r in runs:
        read = io(r["memory_after"]) - io(r["memory_before"])
        rows.append({**{k: r[k] for k in ("name", "round")},
                     "p50_ms": r["latency_ms"]["p50"], "bytes_read": read})
    out = []
    for name in sorted({r["name"] for r in rows}):
        group = [r for r in rows if r["name"] == name]
        # A negative delta means the container was recreated between the two
        # readings, so the counter reset and the run cannot be compared.
        usable = [r for r in group if r["bytes_read"] >= 0]
        median = sorted(r["bytes_read"] for r in usable)[len(usable) // 2] if usable else 0
        for r in group:
            if r["bytes_read"] < 0:
                verdict = "counter reset, unusable"
            elif median and abs(r["bytes_read"] - median) / median > 0.4:
                verdict = "reads disagree with siblings, cache was not cold"
            else:
                verdict = "consistent"
            out.append({**r, "median_bytes_read": median, "verdict": verdict})
    keep = [r for r in out if r["verdict"] == "consistent"]
    e7._write(RESULTS / "e7b_check.json", {
        "runs": out,
        "consistent": len(keep),
        "total": len(out),
        "rule": "a run is comparable only if its block reads sit within 40% of its cell's median",
    })
    for r in out:
        if r["verdict"] != "consistent":
            print(f"  DROP r{r['round']} {r['name']}: {r['p50_ms']} ms, {r['verdict']}")
    print(f"{len(keep)} of {len(out)} runs comparable")


# ------------------------------------- E7a's float32 row, re-run on 2026-08-13


def float32() -> None:
    """The float32 quality cell, scored against the original vectors for real.

    The float32 row in `results/e7a.json` is int8 without rescoring. The client
    omits `quantization_config=None` from the request rather than sending a
    clear, so that cell inherited the int8 config the Phase 1 memory work left
    on the collection and scored against it with `rescore` unset, which resolves
    to false for scalar quantization.

    Clearing the collection config is not the fix either: it leaves
    `quantized.data` in every segment, and the search reads the quantized
    storage off the segment rather than off the config. `ignore=True` on the
    query is the fix, and it is what the original cell should have sent.
    """
    reference = json.loads((RESULTS / "exact.json").read_text())["top10"]
    qrels = _qrels()
    query_ids, vectors = _queries()
    e7.up(CONFIG_LIMIT)
    e7._wait_ready()
    conn = e7._client()
    config = json.loads(conn.get_collection(e7.COLLECTION).config.model_dump_json())
    result = _pass(conn, query_ids, vectors, ignore=True)
    scored = _score(result["runs"], reference, qrels)

    # The defect this task exists to correct would repeat silently if the flag
    # did nothing, so the run asserts it changed the ranking the old row saw.
    old = next(
        c for c in json.loads((RESULTS / "e7a.json").read_text())["cells"]
        if c["storage"] == "int8" and c["rescore"] is False
    )
    if scored == old["per_query"]:
        raise SystemExit("ignore=True returned the int8 ranking; the flag did nothing")

    e7._write(
        RESULTS / "e7a_float32.json",
        {
            "cell": {"storage": "float32", "rescore": None, "oversampling": None},
            "method": "graph search with QuantizationSearchParams(ignore=True)",
            "supersedes": (
                "the float32 row of results/e7a.json, which measured int8 without "
                "rescoring because quantization_config=None does not clear the field"
            ),
            "collection_quantization_config": config.get("quantization_config"),
            "memory_limit": e7._limit(),
            "latency_ms": result["latency_ms"],
            "per_query": scored,
        },
    )
    print("float32 re-run written to results/e7a_float32.json")


TASKS = {"exact": exact, "e7a": e7a, "e7b": e7b, "decide": decide, "check": check,
         "float32": float32}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in TASKS:
        raise SystemExit(f"usage: python e7_run.py [{' | '.join(TASKS)}]")
    TASKS[sys.argv[1]](*sys.argv[2:])
