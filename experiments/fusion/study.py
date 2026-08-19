"""Tasks E1 to E6 of the plan. python study.py e1 [corpus ...]

run.py owns the measurement layer: corpora, indexes, the 45-arm replay, the
parity gates. Everything here reads what run.py produced and answers one
question the series needs. Output lands in study/, one JSON per task.
"""

from __future__ import annotations

import json
import sys
import time

import numpy as np
import pandas as pd

from harness import CACHE, DIAG, QDRANT_IMAGE, RESULTS, STUDY, SEED
from harness import metrics as M
from harness import replay
from run import (
    CORPORA,
    _by_query,
    REACHABLE,
    _existing_manifest,
    _ideal_ndcg,
    _load_cached,
    _merge_json,
    _relevance_map,
    _union_recall,
    build_legs,
    load_legs,
    replay_grid,
)


# --------------------------------------------------------------------- shared


def per_query_ndcg(name: str, build: int = 1) -> pd.DataFrame:
    """Query by arm nDCG@10 for one corpus, reachable arms only.

    Every task here works on paired per-query differences against the default
    arm, so the frame is the unit of analysis rather than the corpus mean.
    """
    frame = pd.read_parquet(RESULTS / f"{name}.parquet")
    frame = frame[(frame["metric"] == "ndcg_cut_10") & (frame["build"] == build)]
    wide = frame.pivot(index="query_id", columns="arm", values="value")
    arms = [arm for arm in REACHABLE if arm in wide.columns]
    return wide[arms].sort_index()


def _write(task: str, payload: dict, merge: bool = False):
    """Write a task's artifact.

    `merge` keeps corpora an earlier run already wrote, so calling a per-corpus
    task on a subset tops the file up instead of replacing it. Without it,
    `study.py e3 arguana` would silently drop SciFact's results.
    """
    path = STUDY / f"{task}.json"
    if merge and path.exists():
        current = json.loads(path.read_text())
        current.update(payload)
        payload = current
    path.write_text(json.dumps(payload, indent=2, default=float))
    print(f"wrote {path} ({len(payload)} entries)")


# ------------------------------------------------------------------------ E1

# Selection and reporting happen on different queries. A winner picked on the
# queries it was picked on is not a result, so every split reports the gain it
# keeps on queries that had no say in choosing it.


def e1(names=None, splits: int = 200, seed: int = SEED):
    """Pick the best arm on half the queries, report it on the other half."""
    names = names or CORPORA
    report = {}
    for name in names:
        wide = per_query_ndcg(name)
        default = wide[replay.DEFAULT_ARM].to_numpy()
        gains = wide.sub(wide[replay.DEFAULT_ARM], axis=0).drop(columns=[replay.DEFAULT_ARM])
        arms = list(gains.columns)
        values = gains.to_numpy()
        n = len(wide)

        full_mean = values.mean(axis=0)
        full_winner = arms[int(full_mean.argmax())]

        rng = np.random.default_rng(seed)
        rows = []
        for split in range(splits):
            order = rng.permutation(n)
            a, b = order[: n // 2], order[n // 2 :]
            chosen = int(values[a].mean(axis=0).argmax())
            held = values[b, chosen]
            interval = M.bootstrap_interval(held, seed=seed + split)
            # Where the selected arm lands once it is scored on queries that
            # had no say in picking it. Rank 1 of 30 means the sweep found the
            # real winner; a rank in the middle means it fitted noise.
            held_means = values[b].mean(axis=0)
            rows.append(
                {
                    "arm": arms[chosen],
                    "selection_gain": float(values[a, chosen].mean()),
                    "held_out_gain": float(held.mean()),
                    "held_out_low": interval["low"],
                    "clears": bool(interval["low"] > 0),
                    "held_out_rank": int((held_means > held_means[chosen]).sum() + 1),
                    "hurts": bool(held.mean() < 0),
                    "matches_full_set_winner": arms[chosen] == full_winner,
                }
            )

        frame = pd.DataFrame(rows)
        canonical = rows[0]
        # Shrinkage is the number part 1 quotes: how much of the gain a sweep
        # reports on its own queries is still there on queries it never saw.
        kept = frame["held_out_gain"].sum() / frame["selection_gain"].sum()
        report[name] = {
            "queries": int(n),
            "half": int(n // 2),
            "splits": splits,
            "full_set_winner": full_winner,
            "full_set_gain": float(full_mean.max()),
            "canonical_split": canonical,
            "clears_on_held_out_share": float(frame["clears"].mean()),
            "median_selection_gain": float(frame["selection_gain"].median()),
            "median_held_out_gain": float(frame["held_out_gain"].median()),
            "gain_kept_on_held_out": float(kept),
            "median_held_out_rank": float(frame["held_out_rank"].median()),
            "arms_ranked": len(arms),
            "hurts_on_held_out_share": float(frame["hurts"].mean()),
            "picked_full_set_winner_share": float(frame["matches_full_set_winner"].mean()),
            "distinct_arms_picked": int(frame["arm"].nunique()),
            "arms_picked": frame["arm"].value_counts().to_dict(),
        }
        r = report[name]
        print(
            f"{name:14s} n={n:5d} full winner={full_winner} ({r['full_set_gain']:+.4f}) | "
            f"canonical {canonical['arm']} {canonical['selection_gain']:+.4f} -> "
            f"{canonical['held_out_gain']:+.4f} clears={canonical['clears']} | "
            f"over {splits} splits: clears {r['clears_on_held_out_share']:.0%}, "
            f"keeps {kept:.0%}, held-out rank {r['median_held_out_rank']:.0f}/{len(arms)}, "
            f"hurts {r['hurts_on_held_out_share']:.0%}"
        )
    _write("e1_held_out", report, merge=True)
    return report


# ------------------------------------------------------------------------ E2

# Subsamples are drawn from the same query pool, so this measures the interval
# a labeled set of that size gives you, not an independent replication.

SIZES = (25, 50, 100, 200, 300, 500, 1000)
DETECTABLE = (0.015, 0.04)


def e2(names=None, trials: int = 200, seed: int = SEED):
    """How wide is the interval, and what gain can a set of that size confirm."""
    names = names or CORPORA
    report = {}
    for name in names:
        started = time.time()
        wide = per_query_ndcg(name)
        gains = wide.sub(wide[replay.DEFAULT_ARM], axis=0).drop(columns=[replay.DEFAULT_ARM])
        best_arm = gains.mean().idxmax()
        true_gain = float(gains[best_arm].mean())
        differences = gains[best_arm].to_numpy()
        n = len(differences)

        rng = np.random.default_rng(seed)
        sizes = {}
        for size in SIZES:
            if size > n:
                continue
            # Large n needs fewer trials: the spread across trials falls with
            # the size being measured.
            count = trials if size <= 200 else max(trials // 2, 50)
            widths, confirmed = [], []
            for trial in range(count):
                sample = differences[rng.choice(n, size=size, replace=False)]
                interval = M.bootstrap_interval(sample, seed=seed + trial)
                widths.append(interval["half_width"])
                confirmed.append(interval["low"] > 0)
            sizes[str(size)] = {
                "trials": count,
                "median_half_width": float(np.median(widths)),
                "confirmed_share": float(np.mean(confirmed)),
                # At size == n every draw is the same query set, so the only
                # thing moving is the bootstrap seed. Read that cell as the
                # whole corpus, not as a sample of it.
                "is_whole_corpus": size == n,
            }

        report[name] = {
            "queries": int(n),
            "best_arm": str(best_arm),
            "true_gain": true_gain,
            "sizes": sizes,
            "queries_needed": {
                str(target): _first_size_below(sizes, target) for target in DETECTABLE
            },
        }
        print(f"{name:14s} best={best_arm} gain={true_gain:+.4f} ({time.time() - started:.0f}s)")
        for size, entry in sizes.items():
            print(
                f"    n={size:>5s} half-width={entry['median_half_width']:.4f} "
                f"confirmed={entry['confirmed_share']:.0%}"
                f"{' (whole corpus)' if entry['is_whole_corpus'] else ''}"
            )

    # The one line part 1 quotes: how wide an interval a set of that size buys,
    # across corpora, on samples that are actually samples.
    across = {}
    for size in SIZES:
        widths = [
            entry["sizes"][str(size)]["median_half_width"]
            for entry in report.values()
            if str(size) in entry["sizes"] and not entry["sizes"][str(size)]["is_whole_corpus"]
        ]
        if widths:
            across[str(size)] = {
                "corpora": len(widths),
                "median_half_width": float(np.median(widths)),
                "min": float(np.min(widths)),
                "max": float(np.max(widths)),
            }
    payload = {"per_corpus": report, "across_corpora": across}
    print("\nacross corpora, median interval half-width by labeled set size")
    for size, entry in across.items():
        print(
            f"    n={size:>5s} {entry['median_half_width']:.4f} "
            f"({entry['min']:.4f} to {entry['max']:.4f}, {entry['corpora']} corpora)"
        )
    _write("e2_labeled_set_size", payload)
    return payload


def _first_size_below(sizes: dict, target: float):
    """Smallest swept size whose median half-width is under the target gain."""
    for size, entry in sizes.items():
        if entry["median_half_width"] < target:
            return int(size)
    return None


# ------------------------------------------------------------------------ E5

# Part 2's spine. A second prefetch can pay in two ways: it can bring documents
# the first one never retrieved, and it can vote on the ones it did. These are
# separable, and the answer decides what part 2 tells a reader to expect.
#
# The split is a sequential accounting identity, not a symmetric attribution:
# holding one prefetch fixed and admitting the other's exclusive documents is a
# different question depending on which one you hold. Both directions are
# reported so no single ordering carries the claim.

E5_ARMS = ("rrf_k2_w1-1", "rrf_k61_w1-1", "dbsf")
CUTOFFS = (10, 20, 100)
PREFETCHES = (("dense", "dense_only"), ("sparse", "sparse_only"))


def e5(names=None, top: int = 10):
    """What each prefetch alone contributes, and how much of it reaches the top."""
    names = names or CORPORA
    report = {}
    for name in names:
        started = time.time()
        legs = load_legs(name, 1)
        qrels = pd.read_parquet(CACHE / f"{name}_qrels.parquet")
        relevance = _relevance_map(qrels)
        qrels_map = M.qrels_dict(qrels)
        mean_ndcg = (
            pd.read_parquet(RESULTS / f"{name}.parquet")
            .query("metric == 'ndcg_cut_10' and build == 1")
            .groupby("arm")["value"]
            .mean()
        )

        counts = {"dense_only": [], "sparse_only": [], "both": [], "neither": []}
        survival = {arm: {"dense_only": [0, 0], "sparse_only": [0, 0]} for arm in E5_ARMS}
        # Single-positive corpora get the readable version of the same question:
        # one prefetch alone found the answer, did fusion show it in the top 10.
        solo = {arm: {"dense_only": [0, 0], "sparse_only": [0, 0]} for arm in E5_ARMS}
        top10_relevant = {arm: {"both": 0, "dense_only": 0, "sparse_only": 0} for arm in E5_ARMS}
        # runs[arm][held_prefetch] = the fused order cut down to that prefetch's
        # own candidates; runs[arm]["full"] is the fusion a reader would get.
        runs = {arm: {"full": {}, "dense": {}, "sparse": {}} for arm in E5_ARMS}
        base_runs = {"dense": {}, "sparse": {}}
        oracle = {"dense": [], "sparse": [], "union": []}
        recall = {"dense": [], "sparse": [], "union": []}

        for query_id, query_legs in legs.items():
            key = str(query_id)
            labels = relevance.get(key, {})
            wanted = {pid for pid, rel in labels.items() if rel > 0}
            sets = {
                "dense": set(query_legs.ids[0].tolist()),
                "sparse": set(query_legs.ids[1].tolist()),
            }
            sets["union"] = sets["dense"] | sets["sparse"]

            for index, (side, arm_name) in enumerate(PREFETCHES):
                ids, scores = replay.run_arm(arm_name, query_legs)
                base_runs[side][key] = M.run_entry(ids)
            for arm in E5_ARMS:
                point_ids, _ = replay.run_arm(arm, query_legs)
                runs[arm]["full"][key] = M.run_entry(point_ids)
                for side in ("dense", "sparse"):
                    runs[arm][side][key] = M.run_entry(
                        [pid for pid in point_ids if int(pid) in sets[side]]
                    )

            if not wanted:
                continue
            for side in ("dense", "sparse", "union"):
                oracle[side].append(M.ideal_ndcg_at_10(sets[side], labels))
                recall[side].append(len(wanted & sets[side]) / len(wanted))

            unique = {
                "dense_only": (sets["dense"] - sets["sparse"]) & wanted,
                "sparse_only": (sets["sparse"] - sets["dense"]) & wanted,
            }
            counts["dense_only"].append(len(unique["dense_only"]))
            counts["sparse_only"].append(len(unique["sparse_only"]))
            counts["both"].append(len(sets["dense"] & sets["sparse"] & wanted))
            counts["neither"].append(len(wanted - sets["union"]))
            single = len(wanted) == 1

            for arm in E5_ARMS:
                head = [int(p) for p in replay.run_arm(arm, query_legs)[0][:top]]
                for point_id in head:
                    if labels.get(point_id, 0) > 0:
                        source = (
                            "both"
                            if point_id in sets["dense"] and point_id in sets["sparse"]
                            else "dense_only" if point_id in sets["dense"] else "sparse_only"
                        )
                        top10_relevant[arm][source] += 1
                for source, found in unique.items():
                    survival[arm][source][0] += len(found)
                    survival[arm][source][1] += len(found & set(head))
                    if single and found:
                        solo[arm][source][0] += 1
                        solo[arm][source][1] += len(found & set(head))

        # Both directions of the split, at three cutoffs, so the top-10 result
        # cannot be a truncation artifact without showing up here.
        directions = {}
        for held, other in (("dense", "sparse"), ("sparse", "dense")):
            base = _ndcg_by_cutoff(qrels_map, base_runs[held])
            directions[held] = {"prefetch_alone": base, "arms": {}}
            for arm in E5_ARMS:
                reordered = _ndcg_by_cutoff(qrels_map, runs[arm][held])
                full = _ndcg_by_cutoff(qrels_map, runs[arm]["full"])
                directions[held]["arms"][arm] = {
                    "admits": f"{other}-only candidates",
                    "reordered": reordered,
                    "fused": full,
                    "from_reordering": {c: reordered[c] - base[c] for c in CUTOFFS},
                    "from_new_candidates": {c: full[c] - reordered[c] for c in CUTOFFS},
                    "total": {c: full[c] - base[c] for c in CUTOFFS},
                }
            directions[held]["per_query_admission"] = _per_query_effect(
                qrels_map, runs[replay.DEFAULT_ARM][held], runs[replay.DEFAULT_ARM]["full"]
            )

        leading = "dense" if mean_ndcg["dense_only"] >= mean_ndcg["sparse_only"] else "sparse"
        report[name] = {
            "queries_with_labels": len(counts["both"]),
            "leading_prefetch": leading,
            "relevant_per_query": {k: float(np.mean(v)) for k, v in counts.items()},
            # Falsifier for "the documents are not there": what the best possible
            # ranking of each candidate set would score, and how many of the
            # relevant documents each set holds at depth 200.
            "candidate_set": {
                "oracle_ndcg_10": {k: float(np.mean(v)) for k, v in oracle.items()},
                "relevant_recall_200": {k: float(np.mean(v)) for k, v in recall.items()},
            },
            "survival_into_top10": {
                arm: {
                    source: {
                        "found": int(pair[0]),
                        "survived": int(pair[1]),
                        "share": float(pair[1] / pair[0]) if pair[0] else None,
                    }
                    for source, pair in entry.items()
                }
                for arm, entry in survival.items()
            },
            "single_positive_survival": {
                arm: {
                    source: {
                        "queries": int(pair[0]),
                        "survived": int(pair[1]),
                        "share": float(pair[1] / pair[0]) if pair[0] else None,
                    }
                    for source, pair in entry.items()
                }
                for arm, entry in solo.items()
            },
            "top10_relevant_by_source": {
                arm: {
                    source: {"count": count, "share": float(count / max(sum(entry.values()), 1))}
                    for source, count in entry.items()
                }
                for arm, entry in top10_relevant.items()
            },
            "directions": directions,
            "ndcg_10": {
                "dense_only": float(mean_ndcg["dense_only"]),
                "sparse_only": float(mean_ndcg["sparse_only"]),
                "default": float(mean_ndcg[replay.DEFAULT_ARM]),
                "best_single_prefetch": float(max(mean_ndcg["dense_only"], mean_ndcg["sparse_only"])),
            },
        }
        _print_e5(name, report[name], time.time() - started)
    _write("e5_second_prefetch", report, merge=True)
    return report


def _ndcg_by_cutoff(qrels_map: dict, run: dict, cutoffs=CUTOFFS) -> dict:
    import pytrec_eval

    evaluator = pytrec_eval.RelevanceEvaluator(qrels_map, {f"ndcg_cut.{c}" for c in cutoffs})
    scored = evaluator.evaluate(run)
    return {
        c: float(np.mean([values[f"ndcg_cut_{c}"] for values in scored.values()])) for c in cutoffs
    }


def _per_query_effect(qrels_map: dict, before: dict, after: dict, cutoff: int = 10) -> dict:
    """How many queries admitting the other prefetch's candidates helps and hurts.

    A mean near zero can be a small effect on every query or a large win on a
    few paid for by a large loss on a few others.
    """
    import pytrec_eval

    evaluator = pytrec_eval.RelevanceEvaluator(qrels_map, {f"ndcg_cut.{cutoff}"})
    key = f"ndcg_cut_{cutoff}"
    first, second = evaluator.evaluate(before), evaluator.evaluate(after)
    deltas = np.array([second[q][key] - first[q][key] for q in first])
    return {
        "queries": int(len(deltas)),
        "helped": int((deltas > 0).sum()),
        "hurt": int((deltas < 0).sum()),
        "unchanged": int((deltas == 0).sum()),
        "mean_when_helped": float(deltas[deltas > 0].mean()) if (deltas > 0).any() else 0.0,
        "mean_when_hurt": float(deltas[deltas < 0].mean()) if (deltas < 0).any() else 0.0,
        "net": float(deltas.mean()),
    }


def _print_e5(name: str, entry: dict, seconds: float):
    lead = entry["leading_prefetch"]
    split = entry["directions"][lead]["arms"][replay.DEFAULT_ARM]
    alone = entry["directions"][lead]["prefetch_alone"][10]
    cand = entry["candidate_set"]
    admission = entry["directions"][lead]["per_query_admission"]
    print(
        f"{name:14s} {lead} alone {alone:.4f} -> reordering {split['from_reordering'][10]:+.4f} "
        f"+ new candidates {split['from_new_candidates'][10]:+.4f} = {split['total'][10]:+.4f} "
        f"({seconds:.0f}s)"
    )
    print(
        f"{'':14s} oracle@10 {lead} {cand['oracle_ndcg_10'][lead]:.4f} vs union "
        f"{cand['oracle_ndcg_10']['union']:.4f} | relevant recall@200 "
        f"{cand['relevant_recall_200'][lead]:.4f} vs union {cand['relevant_recall_200']['union']:.4f}"
    )
    print(
        f"{'':14s} admitting them: helps {admission['helped']}, hurts {admission['hurt']}, "
        f"unchanged {admission['unchanged']} of {admission['queries']} queries"
    )
    print(
        f"{'':14s} new candidates by cutoff: "
        + ", ".join(f"@{c} {split['from_new_candidates'][c]:+.4f}" for c in CUTOFFS)
    )


def _pct(value):
    return "n/a" if value is None else f"{value:.0%}"


# ------------------------------------------------------------------------ E3

# A cross rather than a full grid: depth swept at the baseline hnsw_ef, and
# hnsw_ef swept at the baseline depth. The interaction is not what part 3 asks
# about, and a full grid costs three times as much for the same two answers.
E3_DEPTHS = (10, 20, 50, 100, 200, 500)
E3_EFS = (16, 64, 128, 512)


def e3(names=None):
    """Depth and hnsw_ef against realized quality and the ceiling, five corpora."""
    from harness import qio

    names = names or CORPORA
    conn = qio.client()
    report = {}
    for name in names:
        started = time.time()
        corpus = _load_cached(name)
        qrels = pd.read_parquet(CACHE / f"{name}_qrels.parquet")
        relevance = _relevance_map(qrels)
        query_dense = np.load(CACHE / f"{name}_qdense.npy")
        model = qio.bm25_model(_existing_manifest()["corpora"][name]["avg_len"])
        query_sparse = qio.sparse_vectors(model, corpus.queries["text"], is_query=True)

        # The sparse prefetch does not read hnsw_ef, so it is retrieved once per
        # depth and reused across the ef sweep.
        sparse_by_depth = {}
        settings = [(qio.BASELINE_HNSW_EF, depth) for depth in E3_DEPTHS]
        settings += [(ef, qio.DEPTH) for ef in E3_EFS if ef != qio.BASELINE_HNSW_EF]

        entries = {}
        for hnsw_ef, depth in settings:
            if depth not in sparse_by_depth:
                sparse_by_depth[depth] = qio.retrieve(
                    conn, name, corpus, query_sparse, "sparse", depth
                )
            dense = qio.retrieve(conn, name, corpus, query_dense, "dense", depth, hnsw_ef)
            legs = build_legs(dense, sparse_by_depth[depth])
            results, _, _ = replay_grid(legs, qrels, build=1, store_fused=False)
            ndcg = results[results["metric"] == "ndcg_cut_10"].groupby("arm")["value"].mean()
            reachable = ndcg[list(REACHABLE)].sort_values(ascending=False)
            entry = {
                "hnsw_ef": hnsw_ef,
                "depth": depth,
                "union_recall": _union_recall(legs, relevance),
                "ceiling_ndcg_10": _ideal_ndcg(legs, relevance),
                "default_ndcg_10": float(ndcg[replay.DEFAULT_ARM]),
                "best_ndcg_10": float(reachable.iloc[0]),
                "best_arm": reachable.index[0],
                "dense_only_ndcg_10": float(ndcg["dense_only"]),
                "sparse_only_ndcg_10": float(ndcg["sparse_only"]),
            }
            entry["gap_to_ceiling"] = entry["ceiling_ndcg_10"] - entry["default_ndcg_10"]
            entries[f"ef{hnsw_ef}_depth{depth}"] = entry
            print(
                f"{name:14s} ef={hnsw_ef:<4} depth={depth:<4} recall={entry['union_recall']:.4f} "
                f"ceiling={entry['ceiling_ndcg_10']:.4f} default={entry['default_ndcg_10']:.4f} "
                f"best={entry['best_ndcg_10']:.4f} gap={entry['gap_to_ceiling']:.4f}"
            )

        baseline = entries[f"ef{qio.BASELINE_HNSW_EF}_depth{qio.DEPTH}"]
        depth_arm = [entries[f"ef{qio.BASELINE_HNSW_EF}_depth{d}"] for d in E3_DEPTHS]
        ef_arm = [
            entries[f"ef{ef}_depth{qio.DEPTH}"] for ef in E3_EFS
        ]
        report[name] = {
            "settings": entries,
            "depth_sweep": {
                "ceiling_span": _span(depth_arm, "ceiling_ndcg_10"),
                "default_span": _span(depth_arm, "default_ndcg_10"),
                "best_span": _span(depth_arm, "best_ndcg_10"),
                "recall_span": _span(depth_arm, "union_recall"),
            },
            "hnsw_ef_sweep": {
                "ceiling_span": _span(ef_arm, "ceiling_ndcg_10"),
                "default_span": _span(ef_arm, "default_ndcg_10"),
                "recall_span": _span(ef_arm, "union_recall"),
            },
            "baseline": baseline,
        }
        print(f"{name:14s} done in {time.time() - started:.0f}s")
    _write("e3_breadth", report, merge=True)
    return report


def _span(entries, key: str) -> dict:
    values = [entry[key] for entry in entries]
    return {"min": float(min(values)), "max": float(max(values)), "span": float(max(values) - min(values))}


# The latency pass is a separate task on purpose. The sweep above batches 64
# queries per request and re-runs prefetches in a fixed order, so its wall clock
# is batch throughput under a warming cache, not what a reader would see.
E3_LATENCY_QUERIES = 100
E3_LATENCY_REPEATS = 3


def e3_latency(names=None, queries: int = E3_LATENCY_QUERIES, repeats: int = E3_LATENCY_REPEATS):
    """One fused query_points per request, randomized across settings."""
    from qdrant_client import models

    from harness import qio

    names = names or CORPORA
    conn = qio.client()
    report = {}
    for name in names:
        started = time.time()
        corpus = _load_cached(name)
        query_dense = np.load(CACHE / f"{name}_qdense.npy")
        model = qio.bm25_model(_existing_manifest()["corpora"][name]["avg_len"])
        query_sparse = qio.sparse_vectors(model, corpus.queries["text"], is_query=True)
        excluded = corpus.self_doc_ids()

        rng = np.random.default_rng(SEED)
        chosen = rng.choice(len(corpus.queries), size=min(queries, len(corpus.queries)), replace=False)
        query_ids = list(corpus.queries["query_id"])

        settings = [("fused", qio.BASELINE_HNSW_EF, depth) for depth in E3_DEPTHS]
        settings += [("fused", ef, qio.DEPTH) for ef in E3_EFS if ef != qio.BASELINE_HNSW_EF]
        settings += [("dense_only", qio.BASELINE_HNSW_EF, qio.DEPTH),
                     ("sparse_only", qio.BASELINE_HNSW_EF, qio.DEPTH)]

        # Shuffle every (setting, query, repeat) together so a warming cache or
        # a drifting machine cannot line up with one setting.
        plan = [(s, int(i), r) for s in settings for i in chosen for r in range(repeats)]
        rng.shuffle(plan)

        # One warm-up pass per setting, discarded.
        for shape, hnsw_ef, depth in settings:
            _timed_query(conn, models, name, shape, hnsw_ef, depth,
                         query_dense[chosen[0]], query_sparse[chosen[0]],
                         excluded.get(query_ids[chosen[0]]))

        timings = {s: [] for s in settings}
        for setting, index, _ in plan:
            shape, hnsw_ef, depth = setting
            timings[setting].append(
                _timed_query(conn, models, name, shape, hnsw_ef, depth,
                             query_dense[index], query_sparse[index],
                             excluded.get(query_ids[index]))
            )

        entries = {}
        for (shape, hnsw_ef, depth), values in timings.items():
            values = np.array(values)
            entries[f"{shape}_ef{hnsw_ef}_depth{depth}"] = {
                "shape": shape,
                "hnsw_ef": hnsw_ef,
                "prefetch_limit": depth,
                "requests": len(values),
                "median_ms": float(np.median(values)),
                "p95_ms": float(np.percentile(values, 95)),
            }
        report[name] = {
            "queries": len(chosen),
            "repeats": repeats,
            "settings": entries,
        }
        for key, entry in entries.items():
            print(f"{name:14s} {key:26s} median={entry['median_ms']:6.2f}ms p95={entry['p95_ms']:6.2f}ms")
        print(f"{name:14s} done in {time.time() - started:.0f}s")

    payload = {"machine": _machine(), "per_corpus": report}
    _write("e3_latency", payload)
    return payload


def _timed_query(conn, models, name, shape, hnsw_ef, depth, dense_vector, sparse_vector, exclude):
    """One request, exactly the shape a reader would send. Returns milliseconds."""
    params = models.SearchParams(hnsw_ef=hnsw_ef, exact=False)
    filter_ = (
        models.Filter(must_not=[models.FieldCondition(key="doc_id", match=models.MatchValue(value=exclude))])
        if exclude
        else None
    )
    dense_prefetch = models.Prefetch(
        query=np.asarray(dense_vector, dtype=np.float32).tolist(),
        using="dense", limit=depth, params=params, filter=filter_,
    )
    sparse_prefetch = models.Prefetch(
        query=sparse_vector, using="bm25", limit=depth, filter=filter_
    )
    started = time.perf_counter()
    if shape == "fused":
        conn.query_points(
            name, prefetch=[dense_prefetch, sparse_prefetch],
            query=models.FusionQuery(fusion=models.Fusion.RRF),
            limit=10, with_payload=False,
        )
    elif shape == "dense_only":
        conn.query_points(
            name, query=np.asarray(dense_vector, dtype=np.float32).tolist(),
            using="dense", limit=10, search_params=params, query_filter=filter_,
            with_payload=False,
        )
    else:
        conn.query_points(
            name, query=sparse_vector, using="bm25", limit=10,
            query_filter=filter_, with_payload=False,
        )
    return (time.perf_counter() - started) * 1000


def _machine() -> dict:
    """Latency is a shape on a stated machine, so the machine ships with it."""
    import platform
    import subprocess

    def _sysctl(key):
        try:
            return subprocess.run(["sysctl", "-n", key], capture_output=True, text=True).stdout.strip()
        except OSError:
            return "unknown"

    return {
        "cpu": _sysctl("machdep.cpu.brand_string") or platform.processor(),
        "memory_gb": round(int(_sysctl("hw.memsize") or 0) / 1024**3),
        "platform": platform.platform(),
        "qdrant": QDRANT_IMAGE,
        "note": "single in-process shard, no network, no fan-out, no concurrent load",
    }


# ------------------------------------------------------------------------ E4

# Three models, one of them outside the MS MARCO family. With only the MS MARCO
# pair a null result on code, products or entities is unreadable: it could mean
# a cross-encoder does not pay, or that an MS MARCO passage reranker does not
# transfer to that domain.
E4_MODELS = (
    "Xenova/ms-marco-MiniLM-L-6-v2",
    "Xenova/ms-marco-MiniLM-L-12-v2",
    "BAAI/bge-reranker-base",
    "jinaai/jina-reranker-v2-base-multilingual",
)
E4_COUNTS = (10, 25, 50, 100, 200)
E4_QUERIES = 200
E4_DEPTH = 200
RERANK = STUDY / "rerank"


def e4_score(names=None, queries: int = E4_QUERIES, threads: int = 15):
    """Score every candidate once per model and cache it. The expensive half.

    A cross-encoder scores one (query, document) pair at a time, so the score of
    a document does not depend on how many candidates were sent. Scoring the top
    200 once gives every smaller candidate count for free.
    """
    from fastembed.rerank.cross_encoder import TextCrossEncoder

    names = names or CORPORA
    RERANK.mkdir(parents=True, exist_ok=True)
    for model_name in E4_MODELS:
        encoder = None
        for name in names:
            path = RERANK / f"{name}__{_slug(model_name)}.parquet"
            if path.exists():
                print(f"{name:14s} {model_name:34s} cached")
                continue
            if encoder is None:
                encoder = TextCrossEncoder(model_name=model_name, threads=threads)
            legs = load_legs(name, 1)
            texts = pd.read_parquet(CACHE / f"{name}_corpus.parquet").set_index("point_id")["text"]
            query_text = pd.read_parquet(CACHE / f"{name}_queries.parquet").set_index("query_id")["text"]
            sample = _sample_queries(legs, queries)

            started, pairs, rows = time.time(), 0, []
            for position, query_id in enumerate(sample, start=1):
                candidates = [int(p) for p in replay.run_arm(replay.DEFAULT_ARM, legs[query_id])[0][:E4_DEPTH]]
                documents = [texts.loc[pid] for pid in candidates]
                scores = list(encoder.rerank(query_text.loc[str(query_id)], documents))
                rows.extend(
                    (str(query_id), pid, rank, float(score))
                    for rank, (pid, score) in enumerate(zip(candidates, scores))
                )
                pairs += len(documents)
                if position % 25 == 0:
                    rate = pairs / (time.time() - started)
                    print(
                        f"{name:14s} {_slug(model_name):22s} {position:4d}/{len(sample)} "
                        f"{rate:6.1f} docs/sec",
                        flush=True,
                    )
            frame = pd.DataFrame(rows, columns=["query_id", "point_id", "fusion_rank", "score"])
            frame.to_parquet(path, index=False)
            elapsed = time.time() - started
            _merge_json(
                RERANK / "throughput.json",
                {f"{name}__{_slug(model_name)}": {
                    "pairs": pairs,
                    "seconds": elapsed,
                    "docs_per_second": pairs / elapsed,
                    "queries": len(sample),
                }},
            )
            print(f"{name:14s} {model_name:34s} {pairs} pairs in {elapsed:.0f}s")


def _sample_queries(legs: dict, queries: int):
    """A fixed query sample, so every model reranks the same work."""
    ids = sorted(legs.keys(), key=str)
    if len(ids) <= queries:
        return ids
    rng = np.random.default_rng(SEED)
    return [ids[i] for i in sorted(rng.choice(len(ids), size=queries, replace=False))]


def _slug(model_name: str) -> str:
    return model_name.split("/")[-1].replace(".", "-")


def e4(names=None, splits: int = 200, seed: int = SEED):
    """Does reranking pay, at which candidate count, against both baselines."""
    names = names or CORPORA
    report = {}
    for name in names:
        legs = load_legs(name, 1)
        qrels = pd.read_parquet(CACHE / f"{name}_qrels.parquet")
        qrels_map = M.qrels_dict(qrels)
        sample = [q for q in _sample_queries(legs, E4_QUERIES) if str(q) in qrels_map]

        # Both baselines, on the same query sample the reranker saw. Reporting
        # only against the default would hand part 5 credit for the gain the
        # fusion setting already banked.
        per_query = per_query_ndcg(name)
        baselines = {
            arm: per_query.loc[[str(q) for q in sample], arm]
            for arm in (replay.DEFAULT_ARM, per_query.mean().idxmax())
        }
        best_arm = per_query.mean().idxmax()

        arms = {}
        for model_name in E4_MODELS:
            path = RERANK / f"{name}__{_slug(model_name)}.parquet"
            if not path.exists():
                print(f"{name:14s} {model_name} not scored yet, skipping")
                continue
            scores = pd.read_parquet(path)
            ordered = _rerank_orders(scores, E4_COUNTS)
            for count, run in ordered.items():
                values = _per_query_ndcg_run(qrels_map, run)
                arms[f"{_slug(model_name)}@{count}"] = values

        if not arms:
            continue
        table = pd.DataFrame(arms).reindex([str(q) for q in sample]).dropna()
        default = baselines[replay.DEFAULT_ARM].reindex(table.index)
        best = baselines[best_arm].reindex(table.index)

        report[name] = {
            "queries": int(len(table)),
            "best_fusion_arm": str(best_arm),
            "baselines": {
                "rrf_default": float(default.mean()),
                "best_fusion_arm": float(best.mean()),
            },
            "configurations": {
                key: {
                    "ndcg_10": float(table[key].mean()),
                    "vs_rrf_default": float((table[key] - default).mean()),
                    "vs_best_fusion_arm": float((table[key] - best).mean()),
                }
                for key in table.columns
            },
            "held_out": _e4_held_out(
                table,
                per_query.reindex(table.index),
                replay.DEFAULT_ARM,
                splits,
                seed,
            ),
        }
        _print_e4(name, report[name])
    _write("e4_reranking", report)
    return report


def _rerank_orders(scores: pd.DataFrame, counts) -> dict:
    """For each candidate count, the run a reader would get after reranking.

    The top `count` of the fused list comes back in cross-encoder order; whatever
    the reranker never saw keeps its fusion rank behind it.
    """
    runs = {count: {} for count in counts}
    for query_id, group in scores.groupby("query_id", sort=False):
        group = group.sort_values("fusion_rank", kind="stable")
        point_ids = group["point_id"].to_numpy(np.int64)
        values = group["score"].to_numpy(np.float64)
        for count in counts:
            head = np.lexsort((point_ids[:count], -values[:count]))
            runs[count][str(query_id)] = M.run_entry(
                np.concatenate([point_ids[:count][head], point_ids[count:]])
            )
    return runs


def _per_query_ndcg_run(qrels_map: dict, run: dict) -> dict:
    scored = M.evaluate(qrels_map, run)
    return {qid: values["ndcg_cut_10"] for qid, values in scored.items()}


def _e4_held_out(
    table: pd.DataFrame,
    fusion: pd.DataFrame,
    default_arm: str,
    splits: int,
    seed: int,
):
    """Pick reranker and fusion settings on half, compare them on the rest.

    Neither side keeps selection luck from the full query set. Each split picks
    both configurations on one half, then reports their difference on the half
    neither selection saw.
    """
    reranker_values = table.to_numpy()
    fusion_values = fusion.to_numpy()
    reranker_names = list(table.columns)
    fusion_names = list(fusion.columns)
    default = fusion_names.index(default_arm)
    n = len(table)
    rng = np.random.default_rng(seed)
    rows = []
    for split in range(splits):
        order = rng.permutation(n)
        a, b = order[: n // 2], order[n // 2 :]
        chosen_reranker = int(reranker_values[a].mean(axis=0).argmax())
        chosen_fusion = int(fusion_values[a].mean(axis=0).argmax())
        selected = reranker_values[:, chosen_reranker] - fusion_values[:, chosen_fusion]
        held = selected[b]
        interval = M.bootstrap_interval(held, seed=seed + split)
        rows.append(
            {
                "configuration": reranker_names[chosen_reranker],
                "fusion_arm": fusion_names[chosen_fusion],
                "selection_gain": float(selected[a].mean()),
                "held_out_gain": float(held.mean()),
                "held_out_vs_rrf_default": float(
                    (reranker_values[b, chosen_reranker] - fusion_values[b, default]).mean()
                ),
                "clears": bool(interval["low"] > 0),
            }
        )
    frame = pd.DataFrame(rows)
    return {
        "splits": splits,
        "baseline": "split_selected_fusion_arm",
        "median_selection_gain": float(frame["selection_gain"].median()),
        "median_held_out_gain": float(frame["held_out_gain"].median()),
        "median_held_out_vs_rrf_default": float(
            frame["held_out_vs_rrf_default"].median()
        ),
        "clears_share": float(frame["clears"].mean()),
        "picked": frame["configuration"].value_counts().head(5).to_dict(),
        "fusion_picked": frame["fusion_arm"].value_counts().head(5).to_dict(),
    }


def _print_e4(name: str, entry: dict):
    ranked = sorted(
        entry["configurations"].items(), key=lambda kv: kv[1]["ndcg_10"], reverse=True
    )
    held = entry["held_out"]
    print(
        f"{name:14s} default={entry['baselines']['rrf_default']:.4f} "
        f"best fusion ({entry['best_fusion_arm']})={entry['baselines']['best_fusion_arm']:.4f}"
    )
    for key, values in ranked[:3]:
        print(
            f"{'':14s}   {key:34s} {values['ndcg_10']:.4f} "
            f"vs default {values['vs_rrf_default']:+.4f} vs best fusion {values['vs_best_fusion_arm']:+.4f}"
        )
    print(
        f"{'':14s}   held out: picks {list(held['picked'])[0]}, "
        f"{held['median_selection_gain']:+.4f} -> {held['median_held_out_gain']:+.4f} "
        f"over split-selected fusion, clears {held['clears_share']:.0%}"
    )


# ------------------------------------------------------------------------ E6

# Every other number in this study comes from an unquantized collection, and a
# collection at scale is quantized. Quantization reorders the dense candidate
# list, which changes its ranks, which changes what fusion receives. Whether
# part 4's conclusions survive that is the question.
#
# The sparse prefetch is reused from the unquantized build: scalar quantization
# applies to dense vectors only. SciFact rebuilds sparse anyway and asserts the
# two are identical, which is the check behind that sentence.
E6_CORPORA = ("scifact", "dbpedia-entity")
E6_ARMS = (
    ("raw", False, 1.0),
    ("rescore", True, 1.0),
    ("rescore_x2", True, 2.0),
    ("rescore_x4", True, 4.0),
)


def e6(names=None, verify_sparse: str = "scifact"):
    """Rebuild with scalar quantization, re-run the sweep, compare the verdicts."""
    from qdrant_client import models

    from harness import qio

    names = names or list(E6_CORPORA)
    report = {}
    conn = qio.client()
    for name in names:
        started = time.time()
        corpus = _load_cached(name)
        entry = _existing_manifest()["corpora"][name]
        qrels = pd.read_parquet(CACHE / f"{name}_qrels.parquet")
        dense = np.load(CACHE / f"{name}_dense.npy")
        query_dense = np.load(CACHE / f"{name}_qdense.npy")
        model = qio.bm25_model(entry["avg_len"])
        query_sparse = qio.sparse_vectors(model, corpus.queries["text"], is_query=True)

        quantized = f"{name}_sq"
        rebuild_sparse = name == verify_sparse
        sparse = (
            qio.sparse_vectors(model, corpus.docs["text"], is_query=False)
            if rebuild_sparse
            else None
        )
        stats = _build_quantized(conn, models, qio, quantized, corpus, dense, sparse)
        print(f"{name:14s} built {quantized}: {stats} ({time.time() - started:.0f}s)", flush=True)

        cached_sparse = pd.read_parquet(qio.cache_path(name, "sparse", 1))
        sparse_check = None
        if rebuild_sparse:
            fresh = qio.retrieve(conn, quantized, corpus, query_sparse, "sparse")
            sparse_check = qio.compare_runs(cached_sparse, fresh)
            print(
                f"{name:14s} sparse prefetch under quantization: "
                f"{sparse_check['positions_moved']} of {sparse_check['positions_compared']} "
                f"positions moved ({sparse_check['share_moved']:.2%}), every move at an equal "
                f"score: {sparse_check['every_move_at_an_equal_score']}, max score deviation "
                f"{sparse_check['max_score_deviation']:.1e}"
            )

        unquantized_dense = pd.read_parquet(qio.cache_path(name, "dense", 1))
        baseline = _sweep_summary(build_legs(unquantized_dense, cached_sparse), qrels, name)
        arms = {"unquantized": baseline}
        for label, rescore, oversampling in E6_ARMS:
            params = models.SearchParams(
                hnsw_ef=qio.BASELINE_HNSW_EF,
                exact=False,
                quantization=models.QuantizationSearchParams(
                    ignore=False, rescore=rescore, oversampling=oversampling
                ),
            )
            dense_frame = qio.retrieve(
                conn, quantized, corpus, query_dense, "dense", search_params=params
            )
            summary = _sweep_summary(build_legs(dense_frame, cached_sparse), qrels, name)
            summary["rescore"] = rescore
            summary["oversampling"] = oversampling
            summary["dense_agreement"] = _rank_agreement(unquantized_dense, dense_frame)
            arms[label] = summary
            print(
                f"{name:14s} {label:11s} dense_only={summary['dense_only_ndcg_10']:.4f} "
                f"default={summary['default_ndcg_10']:.4f} best_k={summary['best_k']} "
                f"dbsf={summary['dbsf_minus_default']:+.4f} "
                f"top10_agree={summary['dense_agreement']['top10_overlap']:.3f}",
                flush=True,
            )

        report[name] = {
            "collection": quantized,
            "points": stats,
            "sparse_prefetch_check": sparse_check,
            "arms": arms,
            "verdicts": _e6_verdicts(arms),
        }
        print(f"{name:14s} done in {time.time() - started:.0f}s", flush=True)
    _write("e6_quantization", report, merge=True)
    return report


def _build_quantized(conn, models, qio, name, corpus, dense, sparse, batch_size: int = 256):
    """The same collection, int8 scalar quantized, kept in RAM."""
    conn.delete_collection(name)
    conn.create_collection(
        collection_name=name,
        vectors_config={
            "dense": models.VectorParams(size=qio.DENSE_DIM, distance=models.Distance.COSINE)
        },
        sparse_vectors_config={"bm25": models.SparseVectorParams(modifier=models.Modifier.IDF)},
        hnsw_config=models.HnswConfigDiff(
            m=qio.HNSW_M,
            ef_construct=qio.HNSW_EF_CONSTRUCT,
            full_scan_threshold=qio.FULL_SCAN_THRESHOLD_KB,
        ),
        optimizers_config=models.OptimizersConfigDiff(
            indexing_threshold=qio.INDEXING_THRESHOLD_KB
        ),
        quantization_config=models.ScalarQuantization(
            scalar=models.ScalarQuantizationConfig(
                type=models.ScalarType.INT8, quantile=0.99, always_ram=True
            )
        ),
        shard_number=1,
        replication_factor=1,
    )
    conn.create_payload_index(name, "doc_id", field_schema=models.PayloadSchemaType.KEYWORD)

    point_ids = corpus.docs["point_id"].to_numpy()
    doc_ids = list(corpus.docs["doc_id"])
    for start in range(0, len(point_ids), batch_size):
        stop = min(start + batch_size, len(point_ids))
        conn.upsert(
            name,
            points=[
                models.PointStruct(
                    id=int(point_ids[i]),
                    vector=(
                        {"dense": dense[i].tolist(), "bm25": sparse[i]}
                        if sparse is not None
                        else {"dense": dense[i].tolist()}
                    ),
                    payload={"doc_id": doc_ids[i]},
                )
                for i in range(start, stop)
            ],
            wait=True,
        )
    # Wait for the optimizer to finish: a fresh collection turns green before
    # the HNSW graph exists, and retrieving against a half-built index would
    # measure the optimizer rather than quantization.
    return qio._wait_indexed(conn, name, len(point_ids), wait_seconds=1800)


def _sweep_summary(legs: dict, qrels: pd.DataFrame, name: str) -> dict:
    """The three verdicts part 4 rests on, recomputed on one candidate set."""
    results, _, ties = replay_grid(legs, qrels, build=1, store_fused=False)
    ndcg = results[results["metric"] == "ndcg_cut_10"].groupby("arm")["value"].mean()
    sweep = {k: float(ndcg[f"rrf_k{k}_w1-1"]) for k in replay.RRF_KS}
    reachable = ndcg[list(REACHABLE)].sort_values(ascending=False)
    return {
        "default_ndcg_10": float(ndcg[replay.DEFAULT_ARM]),
        "dense_only_ndcg_10": float(ndcg["dense_only"]),
        "sparse_only_ndcg_10": float(ndcg["sparse_only"]),
        "k_sweep": sweep,
        "best_k": max(sweep, key=sweep.get),
        "dbsf_ndcg_10": float(ndcg["dbsf"]),
        "dbsf_minus_default": float(ndcg["dbsf"] - ndcg[replay.DEFAULT_ARM]),
        "best_arm": str(reachable.index[0]),
        "best_ndcg_10": float(reachable.iloc[0]),
        "tie_rate_k2": ties.get("rrf_k2_w1-1"),
        "tie_rate_k61": ties.get("rrf_k61_w1-1"),
        "tie_rate_dbsf": ties.get("dbsf"),
    }


def _rank_agreement(before: pd.DataFrame, after: pd.DataFrame, top: int = 10) -> dict:
    """How far quantization moved the dense candidate list it hands to fusion."""
    first, second = _by_query(before), _by_query(after)
    shared = first.keys() & second.keys()
    top_overlap, full_overlap = [], []
    for query_id in shared:
        a, b = first[query_id][0], second[query_id][0]
        top_overlap.append(len(set(a[:top]) & set(b[:top])) / top)
        full_overlap.append(len(set(a.tolist()) & set(b.tolist())) / max(len(a), 1))
    return {
        "queries": len(shared),
        "top10_overlap": float(np.mean(top_overlap)) if top_overlap else 0.0,
        "candidate_overlap_200": float(np.mean(full_overlap)) if full_overlap else 0.0,
    }


def _e6_verdicts(arms: dict) -> dict:
    """Does each conclusion part 4 ships survive every quantization setting."""
    baseline = arms["unquantized"]
    others = {k: v for k, v in arms.items() if k != "unquantized"}
    return {
        "best_k_unquantized": baseline["best_k"],
        "best_k_under_quantization": {k: v["best_k"] for k, v in others.items()},
        "best_k_holds": all(v["best_k"] == baseline["best_k"] for v in others.values()),
        "dbsf_beats_default_unquantized": baseline["dbsf_minus_default"] > 0,
        "dbsf_beats_default_holds": all(
            (v["dbsf_minus_default"] > 0) == (baseline["dbsf_minus_default"] > 0)
            for v in others.values()
        ),
        "tie_rate_k2_unquantized": baseline["tie_rate_k2"],
        "tie_rate_k2_under_quantization": {k: v["tie_rate_k2"] for k, v in others.items()},
        "default_ndcg_10_cost": {
            k: v["default_ndcg_10"] - baseline["default_ndcg_10"] for k, v in others.items()
        },
        "dense_only_ndcg_10_cost": {
            k: v["dense_only_ndcg_10"] - baseline["dense_only_ndcg_10"] for k, v in others.items()
        },
    }


COMMANDS = {
    "e1": e1,
    "e2": e2,
    "e3": e3,
    "e3_latency": e3_latency,
    "e4_score": e4_score,
    "e4": e4,
    "e5": e5,
    "e6": e6,
}

if __name__ == "__main__":
    command, *args = sys.argv[1:]
    COMMANDS[command](args or None)
