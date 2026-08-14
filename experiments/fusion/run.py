"""Task driver for the hybrid-fusion experiment. python run.py t1 [corpus ...]"""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import time
from importlib.metadata import version

import numpy as np
import pandas as pd
from qdrant_client import models

from harness import BREADTH, CACHE, DIAG, FLOOR, FUSED, MANIFEST, PARITY, RESULTS, ROOT
from harness import QDRANT_IMAGE, QDRANT_URL, SEED
from harness import corpora as C
from harness import metrics as M
from harness import qio, replay

CORPORA = ["scifact", "arguana", "wands", "codesearchnet", "dbpedia-entity"]


# ------------------------------------------------------------------------ T1


def t1(names=None):
    """Load the corpora, measure avg_len, write the caches and the manifest."""
    names = names or CORPORA
    header = _manifest_header()
    manifest = _existing_manifest()
    manifest.update(header)
    MANIFEST.write_text(json.dumps(manifest, indent=2))

    for name in names:
        started = time.time()
        corpus = C.LOADERS[name]()
        # avg_len is measured with the same tokenizer, stopwords and stemmer
        # BM25 will use, because |d| in the formula is the stemmed token count.
        lengths = C.measure_avg_len(list(corpus.docs["text"]), qio.bm25_model(256.0))

        corpus.docs.to_parquet(CACHE / f"{name}_corpus.parquet", index=False)
        corpus.queries.to_parquet(CACHE / f"{name}_queries.parquet", index=False)
        qrels = corpus.qrels.merge(corpus.docs[["doc_id", "point_id"]], on="doc_id", how="inner")
        qrels.to_parquet(CACHE / f"{name}_qrels.parquet", index=False)

        relevant = qrels[qrels["relevance"] > 0]
        _update_corpus(name, {
            "docs": len(corpus.docs),
            "queries": len(corpus.queries),
            "qrels": len(qrels),
            "judged_per_query": round(len(qrels) / len(corpus.queries), 2),
            "relevant_per_query": round(len(relevant) / len(corpus.queries), 2),
            "max_relevance": int(qrels["relevance"].max()),
            "field_recipe": corpus.field_recipe,
            "license": corpus.license,
            "excludes_self": corpus.excludes_self,
            "self_excluded_queries": len(corpus.self_doc_ids()),
            # The sampled document ids are the doc_id column of the corpus
            # cache; this digest pins that sample without inlining 100k ids.
            "doc_id_sha256": _digest(sorted(corpus.docs["doc_id"])),
            "sources": corpus.sources,
            **lengths,
        })
        print(
            f"{name:14s} docs={len(corpus.docs):>7,} queries={len(corpus.queries):>5,} "
            f"avg_len={lengths['avg_len']:>8.2f}  ({time.time() - started:.0f}s)"
        )

    print(f"\nwrote {MANIFEST}")


def _manifest_header() -> dict:
    import requests

    root = requests.get(QDRANT_URL, timeout=10).json()
    return {
        "created": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "seed": SEED,
        "depth": qio.DEPTH,
        "qdrant": {
            "image": QDRANT_IMAGE,
            "digest": _image_digest(),
            "version": root["version"],
            "commit": root["commit"],
            "url": QDRANT_URL,
        },
        "versions": {
            package: version(package)
            for package in ("qdrant-client", "fastembed", "numpy", "pandas", "pytrec_eval-terrier")
        },
        "datasets_note": (
            "Corpora are read from pinned archives rather than the beir package; "
            "each corpus records its source URL and SHA256 under sources."
        ),
        "models": {
            "dense": qio.DENSE_MODEL,
            "dense_dim": qio.DENSE_DIM,
            "distance": "cosine",
            "sparse": qio.SPARSE_MODEL,
            "sparse_modifier": "idf",
            "stemmer": "english",
        },
        "index": {
            "m": qio.HNSW_M,
            "ef_construct": qio.HNSW_EF_CONSTRUCT,
            "full_scan_threshold": qio.FULL_SCAN_THRESHOLD_KB,
            "indexing_threshold": qio.INDEXING_THRESHOLD_KB,
            "quantization": None,
            "shard_number": 1,
            "replication_factor": 1,
            "baseline_hnsw_ef": qio.BASELINE_HNSW_EF,
        },
    }


def _image_digest() -> str:
    out = subprocess.run(
        ["docker", "inspect", "--format", "{{index .RepoDigests 0}}", QDRANT_IMAGE],
        capture_output=True,
        text=True,
    )
    return out.stdout.strip()


def _existing_manifest() -> dict:
    return json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}


def _update_corpus(name: str, patch: dict):
    """Re-read before writing, so two tasks running side by side both survive."""
    manifest = _existing_manifest()
    entry = manifest.setdefault("corpora", {}).setdefault(name, {})
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(entry.get(key), dict):
            entry[key].update(value)
        else:
            entry[key] = value
    MANIFEST.write_text(json.dumps(manifest, indent=2))


def _digest(values) -> str:
    return hashlib.sha256("\n".join(map(str, values)).encode()).hexdigest()


# ------------------------------------------------------------------------ T3


def t3(names=None, build: int = 1):
    """Build the index and cache dense and sparse top-200 for every query."""
    names = names or CORPORA
    conn = qio.client()

    for name in names:
        corpus = _load_cached(name)
        entry = _existing_manifest()["corpora"][name]
        started = time.time()

        dense = qio.dense_embed(corpus.docs["text"], CACHE / f"{name}_dense.npy")
        query_dense = qio.dense_embed(corpus.queries["text"], CACHE / f"{name}_qdense.npy")
        model = qio.bm25_model(entry["avg_len"])
        sparse = qio.sparse_vectors(model, corpus.docs["text"], is_query=False)
        query_sparse = qio.sparse_vectors(model, corpus.queries["text"], is_query=True)
        embedded = time.time()

        stats = qio.build(conn, name, corpus, dense, sparse)
        check = qio.index_check(conn, name, corpus, query_dense)
        if not check["graph_built"]:
            raise RuntimeError(
                f"{name}: indexed_vectors_count {check['indexed_vectors_count']} of "
                f"{check['points_count']} points, so dense search is a full scan"
            )

        for leg, vectors in (("dense", query_dense), ("sparse", query_sparse)):
            frame = qio.retrieve(conn, name, corpus, vectors, leg)
            frame.to_parquet(qio.cache_path(name, leg, build), index=False)
        _update_corpus(name, {"builds": {str(build): {**stats, **check}}})
        print(
            f"{name:14s} embed={embedded - started:>5.0f}s index+retrieve="
            f"{time.time() - embedded:>5.0f}s  {stats['points_count']:,} points"
        )


def _load_cached(name) -> C.Corpus:
    docs = pd.read_parquet(CACHE / f"{name}_corpus.parquet")
    queries = pd.read_parquet(CACHE / f"{name}_queries.parquet")
    qrels = pd.read_parquet(CACHE / f"{name}_qrels.parquet")
    return C.Corpus(
        name=name,
        docs=docs,
        queries=queries,
        qrels=qrels,
        field_recipe="",
        license="",
        excludes_self=(name == "arguana"),
    )


# ------------------------------------------------------------------------ T4

# Gate A already covers the arithmetic. These four arms are the spot check on
# real score distributions: the default, a ported k with lopsided weights, the
# most top-heavy k the server accepts, and DBSF.
PARITY_ARMS = ("rrf_k2_w1-1", "rrf_k61_w1-3", "rrf_k1_w2-4", "dbsf")
RRF_TOLERANCE = 0.0
# The repo's own Welford tolerance, from assert_close in score_fusion.rs.
DBSF_ABS_TOLERANCE, DBSF_REL_TOLERANCE = 1e-5, 1e-4


def t4(names=None, n_queries: int = 10):
    """Live parity spot check against the server's own fusion."""
    names = names or CORPORA
    conn = qio.client()
    verdicts = {}

    for name in names:
        corpus = _load_cached(name)
        query_dense = np.load(CACHE / f"{name}_qdense.npy")
        model = qio.bm25_model(_existing_manifest()["corpora"][name]["avg_len"])
        sample = _stratified_queries(corpus, n_queries)
        query_sparse = qio.sparse_vectors(model, corpus.queries["text"].iloc[sample.index], True)
        excluded = corpus.self_doc_ids()

        report = {"queries": [], "arms": {arm: _blank_verdict() for arm in PARITY_ARMS}}
        for offset, (position, row) in enumerate(sample.iterrows()):
            filter_ = qio._exclusion(excluded.get(row["query_id"]))
            legs, live = _live_legs(conn, name, query_dense[position], query_sparse[offset], filter_)
            report["queries"].append(row["query_id"])
            for arm in PARITY_ARMS:
                served = _server_fusion(conn, name, live, arm, filter_)
                _compare(report["arms"][arm], served, replay.run_arm(arm, legs))

        for arm, verdict in report["arms"].items():
            tolerance = _tolerance(arm, verdict["max_score"])
            verdict["passed"] = verdict["max_deviation"] <= tolerance and not verdict["id_mismatch"]
            verdict["tolerance"] = tolerance
        report["passed"] = all(v["passed"] for v in report["arms"].values())
        (PARITY / f"{name}.json").write_text(json.dumps(report, indent=2))
        verdicts[name] = report["passed"]
        worst = max(v["max_deviation"] for v in report["arms"].values())
        print(
            f"{name:14s} {'PASS' if report['passed'] else 'FAIL'} "
            f"max deviation {worst:.3e}  "
            + "  ".join(f"{a.split('_')[0]}:{v['max_deviation']:.1e}" for a, v in report["arms"].items())
        )

    print(f"\nGate B: {sum(verdicts.values())}/{len(verdicts)} corpora passed")


def _blank_verdict() -> dict:
    return {"max_deviation": 0.0, "max_relative": 0.0, "max_score": 0.0, "id_mismatch": 0,
            "boundary_ties": 0, "compared": 0}


def _tolerance(arm: str, max_score: float) -> float:
    if arm == "dbsf":
        return max(DBSF_ABS_TOLERANCE, DBSF_REL_TOLERANCE * max_score)
    return RRF_TOLERANCE


def _stratified_queries(corpus, n: int) -> pd.DataFrame:
    """Spread the sample across the number of relevant documents per query."""
    counts = (
        corpus.qrels[corpus.qrels["relevance"] > 0].groupby("query_id").size().rename("relevant")
    )
    ranked = corpus.queries.join(counts, on="query_id").fillna({"relevant": 0})
    ranked = ranked.sort_values(["relevant", "query_id"], kind="stable")
    picks = np.linspace(0, len(ranked) - 1, num=min(n, len(ranked))).astype(int)
    return ranked.iloc[picks]


def _live_legs(conn, name, dense_vector, sparse_vector, filter_):
    """Fetch both candidate lists exactly as the prefetches will produce them."""
    requests = [
        models.QueryRequest(
            query=qio._as_query(dense_vector),
            using="dense",
            limit=qio.DEPTH,
            params=models.SearchParams(hnsw_ef=qio.BASELINE_HNSW_EF, exact=False),
            filter=filter_,
            with_payload=False,
        ),
        models.QueryRequest(
            query=sparse_vector, using="bm25", limit=qio.DEPTH, filter=filter_, with_payload=False
        ),
    ]
    dense, sparse = conn.query_batch_points(name, requests)
    pairs = [
        (
            np.array([p.id for p in response.points], dtype=np.int64),
            np.array([p.score for p in response.points], dtype=np.float32),
        )
        for response in (dense, sparse)
    ]
    return replay.QueryLegs(*pairs[0], *pairs[1]), (dense_vector, sparse_vector)


def _server_fusion(conn, name, live, arm: str, filter_):
    dense_vector, sparse_vector = live
    prefetch = [
        models.Prefetch(
            query=qio._as_query(dense_vector),
            using="dense",
            limit=qio.DEPTH,
            params=models.SearchParams(hnsw_ef=qio.BASELINE_HNSW_EF, exact=False),
            filter=filter_,
        ),
        models.Prefetch(query=sparse_vector, using="bm25", limit=qio.DEPTH, filter=filter_),
    ]
    if arm == "dbsf":
        query = models.FusionQuery(fusion=models.Fusion.DBSF)
    else:
        k, weights = replay._parse_rrf(arm)
        query = models.RrfQuery(rrf=models.Rrf(k=k, weights=weights))
    response = conn.query_points(
        name, prefetch=prefetch, query=query, limit=qio.DEPTH, with_payload=False
    )
    return [(int(p.id), float(p.score)) for p in response.points]


def _compare(verdict: dict, served, replayed):
    """Sorted scores are comparable position by position; ids only above the
    last score, since a tied group straddling the limit is cut arbitrarily."""
    replay_ids, replay_scores = replayed
    replay_ids, replay_scores = replay_ids[: qio.DEPTH], replay_scores[: qio.DEPTH]
    server_scores = np.array([score for _, score in served], dtype=np.float32)
    compared = min(len(server_scores), len(replay_scores))
    deviation = np.abs(server_scores[:compared] - replay_scores[:compared])
    peak = float(np.max(np.abs(server_scores[:compared]))) if compared else 0.0

    # Both sides are compared as float32. REST serializes the server's f32
    # score through decimal text, so the float64 the client parses back is a
    # different number from the f32 the engine computed.
    cutoff = min(server_scores[compared - 1], replay_scores[compared - 1]) if compared else 0.0
    server_above = {
        pid for (pid, _), score in zip(served[:compared], server_scores) if score > cutoff
    }
    replay_above = {int(pid) for pid, score in zip(replay_ids, replay_scores) if score > cutoff}

    verdict["max_deviation"] = max(verdict["max_deviation"], float(deviation.max()) if compared else 0.0)
    verdict["max_relative"] = max(
        verdict["max_relative"],
        float((deviation / np.maximum(np.abs(server_scores[:compared]), 1e-12)).max()) if compared else 0.0,
    )
    verdict["max_score"] = max(verdict["max_score"], peak)
    verdict["id_mismatch"] += len(server_above ^ replay_above)
    verdict["boundary_ties"] += compared - len(server_above)
    verdict["compared"] += compared


# ------------------------------------------------------------------------ T5

# fused/ keeps the arms the analysis reads document by document: the default,
# the two ends of the k range, DBSF, and each leg alone. Tie rates for every
# arm are counted during the replay instead of stored.
FUSED_ARMS = ("rrf_k2_w1-1", "rrf_k1_w1-1", "rrf_k61_w1-1", "dbsf", "dense_only", "sparse_only")
FUSED_DEPTH = 20


def t5(names=None, build: int = 1):
    """Replay every arm over the cached candidate lists."""
    names = names or CORPORA
    for name in names:
        started = time.time()
        legs = load_legs(name, build)
        qrels = pd.read_parquet(CACHE / f"{name}_qrels.parquet")
        results, fused, ties = replay_grid(legs, qrels, build, store_fused=(build == 1))

        _append_parquet(RESULTS / f"{name}.parquet", results, ["build", "arm", "query_id"])
        if fused is not None:
            fused.to_parquet(FUSED / f"{name}.parquet", index=False)
        _merge_json(DIAG / f"{name}.json", {f"tie_rate_build{build}": ties})
        best = results[results["metric"] == "ndcg_cut_10"].groupby("arm")["value"].mean()
        print(
            f"{name:14s} build={build} arms={best.size} "
            f"default={best[replay.DEFAULT_ARM]:.4f} best={best.max():.4f} ({best.idxmax()}) "
            f"({time.time() - started:.0f}s)"
        )


def load_legs(name: str, build: int) -> dict:
    dense = pd.read_parquet(qio.cache_path(name, "dense", build))
    sparse = pd.read_parquet(qio.cache_path(name, "sparse", build))
    return build_legs(dense, sparse)


def build_legs(dense: pd.DataFrame, sparse: pd.DataFrame) -> dict:
    dense_groups = _by_query(dense)
    sparse_groups = _by_query(sparse)
    empty = (np.empty(0, np.int64), np.empty(0, np.float32))
    return {
        query_id: replay.QueryLegs(*dense_groups.get(query_id, empty), *sparse_groups.get(query_id, empty))
        for query_id in dense_groups.keys() | sparse_groups.keys()
    }


def _by_query(frame: pd.DataFrame) -> dict:
    frame = frame.sort_values(["query_id", "rank"], kind="stable")
    point_ids = frame["point_id"].to_numpy(np.int64)
    scores = frame["score"].to_numpy(np.float32)
    return {
        query_id: (point_ids[positions], scores[positions])
        for query_id, positions in frame.groupby("query_id", sort=False).indices.items()
    }


def replay_grid(legs: dict, qrels: pd.DataFrame, build: int, store_fused: bool = True):
    """Fuse every query under every arm, then score each arm's run."""
    arms = replay.arm_names()
    qrels_map = M.qrels_dict(qrels)
    relevance = {
        query_id: {int(point_id): int(rel) for point_id, rel in entries.items()}
        for query_id, entries in qrels_map.items()
    }
    runs = {arm: {} for arm in arms}
    tied = {arm: [] for arm in arms}
    fused_rows = []

    for query_id, query_legs in legs.items():
        dense_rank = {int(p): r for r, p in enumerate(query_legs.ids[0])}
        sparse_rank = {int(p): r for r, p in enumerate(query_legs.ids[1])}
        labels = relevance.get(str(query_id), {})
        for arm in arms:
            point_ids, scores = replay.run_arm(arm, query_legs)
            runs[arm][str(query_id)] = M.run_entry(point_ids)
            tied[arm].append(_tie_fraction(scores))
            if not (store_fused and arm in FUSED_ARMS):
                continue
            contribution = replay.leg_contributions(arm, query_legs)
            for rank in range(min(FUSED_DEPTH, len(point_ids))):
                point_id = int(point_ids[rank])
                in_dense, in_sparse = dense_rank.get(point_id), sparse_rank.get(point_id)
                fused_rows.append(
                    (
                        arm,
                        str(query_id),
                        rank,
                        point_id,
                        float(scores[rank]),
                        in_dense,
                        in_sparse,
                        float(contribution[0][in_dense]) if in_dense is not None else None,
                        float(contribution[1][in_sparse]) if in_sparse is not None else None,
                        labels.get(point_id, 0),
                    )
                )

    rows = []
    for arm in arms:
        for query_id, values in M.evaluate(qrels_map, runs[arm]).items():
            for metric, value in values.items():
                rows.append((arm, build, query_id, metric, value))
    results = pd.DataFrame(rows, columns=["arm", "build", "query_id", "metric", "value"])
    fused = (
        pd.DataFrame(
            fused_rows,
            columns=[
                "arm",
                "query_id",
                "rank",
                "point_id",
                "score",
                "dense_rank",
                "sparse_rank",
                "dense_contribution",
                "sparse_contribution",
                "relevance",
            ],
        )
        if store_fused
        else None
    )
    tie_rate = {arm: float(np.mean(values)) for arm, values in tied.items()}
    return results, fused, tie_rate


def _tie_fraction(scores, top: int = 10) -> float:
    """Share of the top 10 whose score is shared with a neighbour in the list.

    Fusion sorts on score alone, so a tied group comes back in whatever order
    the hash map produced and can differ between two identical queries.
    """
    if len(scores) < 2:
        return 0.0
    window = scores[: top + 1]
    same_as_next = window[:-1] == window[1:]
    tied = np.zeros(len(window), dtype=bool)
    tied[:-1] |= same_as_next
    tied[1:] |= same_as_next
    return float(tied[:top].sum()) / min(top, len(scores))


# ------------------------------------------------------------------------ T6

# Only the arms a reader can actually set are ranked against each other.
REACHABLE = tuple(a for a in replay.arm_names() if not a.startswith(("unreachable_", "dense_", "sparse_")))
BREADTH_DEPTHS = (20, 50, 200)
BREADTH_EFS = (16, 128, 512)


def t6(names=None, name: str = "scifact"):
    """Retrieve fresh at each depth and hnsw_ef, then replay the grid on it."""
    conn = qio.client()
    corpus = _load_cached(name)
    qrels = pd.read_parquet(CACHE / f"{name}_qrels.parquet")
    query_dense = np.load(CACHE / f"{name}_qdense.npy")
    model = qio.bm25_model(_existing_manifest()["corpora"][name]["avg_len"])
    query_sparse = qio.sparse_vectors(model, corpus.queries["text"], is_query=True)
    relevance = _relevance_map(qrels)

    report = {}
    for hnsw_ef in BREADTH_EFS:
        for depth in BREADTH_DEPTHS:
            dense = qio.retrieve(conn, name, corpus, query_dense, "dense", depth, hnsw_ef)
            sparse = qio.retrieve(conn, name, corpus, query_sparse, "sparse", depth)
            legs = build_legs(dense, sparse)
            results, _, _ = replay_grid(legs, qrels, build=1, store_fused=False)
            ndcg = results[results["metric"] == "ndcg_cut_10"].groupby("arm")["value"].mean()
            reachable = ndcg[list(REACHABLE)].sort_values(ascending=False)

            entry = {
                "depth": depth,
                "hnsw_ef": hnsw_ef,
                "union_recall": _union_recall(legs, relevance),
                "ideal_ndcg_10": _ideal_ndcg(legs, relevance),
                "dense_recall": _leg_recall(legs, relevance, 0),
                "sparse_recall": _leg_recall(legs, relevance, 1),
                "default_ndcg_10": float(ndcg[replay.DEFAULT_ARM]),
                "best_arm": reachable.index[0],
                "best_ndcg_10": float(reachable.iloc[0]),
                "ordering": list(reachable.index),
                "arm_ndcg_10": {arm: float(value) for arm, value in reachable.items()},
            }
            report[f"ef{hnsw_ef}_depth{depth}"] = entry
            print(
                f"ef={hnsw_ef:<4} depth={depth:<4} union_recall={entry['union_recall']:.4f} "
                f"ideal={entry['ideal_ndcg_10']:.4f} dense_recall={entry['dense_recall']:.4f} "
                f"default={entry['default_ndcg_10']:.4f} "
                f"best={entry['best_ndcg_10']:.4f} ({entry['best_arm']})"
            )

    # The baseline is the setting every other task uses, not the first one run.
    baseline = pd.Series(report[f"ef{qio.BASELINE_HNSW_EF}_depth{qio.DEPTH}"]["arm_ndcg_10"])
    for entry in report.values():
        entry["kendall_tau_vs_baseline"] = _kendall(pd.Series(entry["arm_ndcg_10"]), baseline)
        print(f"  ef={entry['hnsw_ef']:<4} depth={entry['depth']:<4} tau={entry['kendall_tau_vs_baseline']:.3f}")
    (BREADTH / f"{name}.json").write_text(json.dumps(report, indent=2))


def _relevance_map(qrels: pd.DataFrame) -> dict:
    out: dict[str, dict[int, int]] = {}
    for query_id, point_id, rel in zip(qrels["query_id"], qrels["point_id"], qrels["relevance"]):
        out.setdefault(str(query_id), {})[int(point_id)] = int(rel)
    return out


def _union_recall(legs: dict, relevance: dict) -> float:
    scores = []
    for query_id, query_legs in legs.items():
        labels = relevance.get(str(query_id), {})
        wanted = {pid for pid, rel in labels.items() if rel > 0}
        if not wanted:
            continue
        found = set(query_legs.ids[0].tolist()) | set(query_legs.ids[1].tolist())
        scores.append(len(wanted & found) / len(wanted))
    return float(np.mean(scores)) if scores else 0.0


def _leg_recall(legs: dict, relevance: dict, leg: int) -> float:
    scores = []
    for query_id, query_legs in legs.items():
        labels = relevance.get(str(query_id), {})
        wanted = {pid for pid, rel in labels.items() if rel > 0}
        if not wanted:
            continue
        scores.append(len(wanted & set(query_legs.ids[leg].tolist())) / len(wanted))
    return float(np.mean(scores)) if scores else 0.0


def _ideal_ndcg(legs: dict, relevance: dict) -> float:
    scores = [
        M.ideal_ndcg_at_10(
            np.concatenate([query_legs.ids[0], query_legs.ids[1]]), relevance.get(str(query_id), {})
        )
        for query_id, query_legs in legs.items()
        if relevance.get(str(query_id))
    ]
    return float(np.mean(scores)) if scores else 0.0


def _kendall(ordering: pd.Series, baseline: pd.Series) -> float:
    from scipy.stats import kendalltau

    shared = baseline.index.intersection(ordering.index)
    return float(kendalltau(ordering[shared].to_numpy(), baseline[shared].to_numpy()).statistic)


# ------------------------------------------------------------------------ T7


def t7(names=None, name: str = "scifact", builds=(2, 3, 4, 5)):
    """Rebuild the same index four more times, then measure the floor."""
    conn = qio.client()
    corpus = _load_cached(name)
    entry = _existing_manifest()["corpora"][name]
    dense = np.load(CACHE / f"{name}_dense.npy")
    query_dense = np.load(CACHE / f"{name}_qdense.npy")
    model = qio.bm25_model(entry["avg_len"])
    sparse = qio.sparse_vectors(model, corpus.docs["text"], is_query=False)
    query_sparse = qio.sparse_vectors(model, corpus.queries["text"], is_query=True)

    for build in builds:
        started = time.time()
        stats = qio.build(conn, name, corpus, dense, sparse)
        for leg, vectors in (("dense", query_dense), ("sparse", query_sparse)):
            qio.retrieve(conn, name, corpus, vectors, leg).to_parquet(
                qio.cache_path(name, leg, build), index=False
            )
        _update_corpus(name, {"builds": {str(build): stats}})
        t5([name], build=build)
        print(f"  build {build} done in {time.time() - started:.0f}s")

    floor(name)


def floor(name: str = "scifact"):
    """Two times the median per-arm standard deviation of the paired difference."""
    results = pd.read_parquet(RESULTS / f"{name}.parquet")
    ndcg = results[results["metric"] == "ndcg_cut_10"]
    by_build = ndcg.groupby(["build", "arm"])["value"].mean().unstack("arm")
    differences = by_build.sub(by_build[replay.DEFAULT_ARM], axis=0).drop(
        columns=[replay.DEFAULT_ARM]
    )
    reachable = [arm for arm in REACHABLE if arm in differences.columns]
    spread = differences[reachable].std(axis=0, ddof=1)
    floor_value = float(2 * spread.median())

    # The sparse leg is BM25 with corpus-wide IDF over the same documents, so a
    # sparse cache that only reshuffles tied scores across builds means the
    # floor is dense-side graph variance alone.
    sparse = _sparse_cache_agreement(name, sorted(by_build.index))
    bootstrap = _bootstrap_all()
    own = bootstrap.get(name, {})
    widths = [v["high"] - v["low"] for arm, v in own.items() if arm in reachable]
    median_width = float(np.median(widths)) if widths else 0.0

    report = {
        "definition": "2 x median over arms of the per-arm SD of (arm - default) mean nDCG@10 across builds",
        "builds": [int(b) for b in by_build.index],
        "degrees_of_freedom": len(by_build.index) - 1,
        "floor_ndcg_10": floor_value,
        "per_arm_sd_min": float(spread.min()),
        "per_arm_sd_median": float(spread.median()),
        "per_arm_sd_max": float(spread.max()),
        "per_arm_sd": {arm: float(value) for arm, value in spread.items()},
        "default_ndcg_10_per_build": {
            str(build): float(value) for build, value in by_build[replay.DEFAULT_ARM].items()
        },
        "sparse_caches_across_builds": sparse,
        "median_bootstrap_interval_width": median_width,
        "rebuild_multiplier": float(floor_value / median_width) if median_width else None,
    }
    (FLOOR / f"{name}.json").write_text(json.dumps(report, indent=2))
    print(
        f"floor={floor_value:.4f} (2 x median SD; min {spread.min():.4f} max {spread.max():.4f}), "
        f"bootstrap width={median_width:.4f}, multiplier={report['rebuild_multiplier']}"
    )
    return report


def _sparse_cache_agreement(name: str, builds) -> dict:
    """Every later build's sparse cache against the first, ties reported."""
    frames = [pd.read_parquet(qio.cache_path(name, "sparse", b)) for b in builds]
    comparisons = [qio.compare_runs(frames[0], other) for other in frames[1:]]
    return {
        "builds_compared": len(comparisons),
        "identical": all(c["identical"] for c in comparisons),
        "equivalent_up_to_ties": all(c["equivalent_up_to_ties"] for c in comparisons),
        "max_share_moved": max((c["share_moved"] for c in comparisons), default=0.0),
        "max_score_deviation": max((c["max_score_deviation"] for c in comparisons), default=0.0),
        "per_build": {str(b): c for b, c in zip(builds[1:], comparisons)},
    }


def _bootstrap_all(build: int = 1) -> dict:
    """Per corpus and arm, the interval a reader would compute from one build."""
    out = {}
    for name in CORPORA:
        path = RESULTS / f"{name}.parquet"
        if not path.exists():
            continue
        frame = pd.read_parquet(path)
        frame = frame[(frame["metric"] == "ndcg_cut_10") & (frame["build"] == build)]
        wide = frame.pivot(index="query_id", columns="arm", values="value")
        if replay.DEFAULT_ARM not in wide.columns:
            continue
        default = wide[replay.DEFAULT_ARM]
        out[name] = {
            arm: M.bootstrap_interval((wide[arm] - default).to_numpy())
            for arm in wide.columns
            if arm != replay.DEFAULT_ARM
        }
        _merge_json(DIAG / f"{name}.json", {"bootstrap_vs_default": out[name]})
    return out


# ------------------------------------------------------------------------ T8


def t8(names=None):
    """The four moves, per corpus, plus the exhibit query and the figure."""
    names = names or CORPORA
    bootstrap = _bootstrap_all()
    summary = {}
    for name in names:
        path = RESULTS / f"{name}.parquet"
        if not path.exists():
            continue
        qrels = pd.read_parquet(CACHE / f"{name}_qrels.parquet")
        relevance = _relevance_map(qrels)
        legs = load_legs(name, 1)
        results = pd.read_parquet(path)
        ndcg = results[(results["metric"] == "ndcg_cut_10") & (results["build"] == 1)]
        mean_ndcg = ndcg.groupby("arm")["value"].mean()
        fused = pd.read_parquet(FUSED / f"{name}.parquet")

        moves = {
            "move1_can_fusion_help": _move1(legs, relevance, mean_ndcg),
            "move2_where_results_come_from": _move2(fused, legs, relevance),
            "move3_which_way_to_move_k": _move3(mean_ndcg, name),
            "move4_when_to_stop": _move4(mean_ndcg, bootstrap.get(name, {})),
        }
        _merge_json(DIAG / f"{name}.json", moves)
        summary[name] = moves
        m1, m4 = moves["move1_can_fusion_help"], moves["move4_when_to_stop"]
        print(
            f"{name:14s} ceiling={m1['ideal_ndcg_10']:.4f} achieved={m1['default_ndcg_10']:.4f} "
            f"headroom={m1['headroom']:.4f} | best k={moves['move3_which_way_to_move_k']['best_k']} "
            f"| arms clearing the interval: {m4['arms_clearing']} -> prescribe {m4['prescription']}"
        )
    return summary


def _move1(legs, relevance, mean_ndcg) -> dict:
    """Nothing a fusion setting does can reach a document outside the union."""
    ideal = _ideal_ndcg(legs, relevance)
    achieved = float(mean_ndcg[replay.DEFAULT_ARM])
    return {
        "union_recall": _union_recall(legs, relevance),
        "ideal_ndcg_10": ideal,
        "default_ndcg_10": achieved,
        "headroom": ideal - achieved,
        "dense_recall": _leg_recall(legs, relevance, 0),
        "sparse_recall": _leg_recall(legs, relevance, 1),
    }


def _move2(fused: pd.DataFrame, legs, relevance) -> dict:
    """Where the default arm's top 10 came from, and what each leg alone adds."""
    top10 = fused[(fused["arm"] == replay.DEFAULT_ARM) & (fused["rank"] < 10)]
    source = np.where(
        top10["dense_rank"].notna() & top10["sparse_rank"].notna(),
        "both",
        np.where(top10["dense_rank"].notna(), "dense_only", "sparse_only"),
    )
    top10 = top10.assign(source=source)
    shares = top10["source"].value_counts(normalize=True).to_dict()
    relevant_shares = (
        top10[top10["relevance"] > 0]["source"].value_counts(normalize=True).to_dict()
    )

    unique, survived = {"dense": [], "sparse": []}, {"dense": [], "sparse": []}
    kept = {
        (query_id, point_id)
        for query_id, point_id in zip(top10["query_id"], top10["point_id"])
    }
    for query_id, query_legs in legs.items():
        labels = relevance.get(str(query_id), {})
        wanted = {pid for pid, rel in labels.items() if rel > 0}
        if not wanted:
            continue
        sets = [set(query_legs.ids[0].tolist()), set(query_legs.ids[1].tolist())]
        for index, leg in enumerate(("dense", "sparse")):
            only = (sets[index] - sets[1 - index]) & wanted
            unique[leg].append(len(only))
            survived[leg].append(sum((str(query_id), pid) in kept for pid in only))
    return {
        "top10_source_share": shares,
        "top10_relevant_source_share": relevant_shares,
        "unique_relevant_per_query": {k: float(np.mean(v)) for k, v in unique.items()},
        "unique_relevant_surviving_into_top10": {
            k: float(np.sum(survived[k]) / max(np.sum(unique[k]), 1)) for k in unique
        },
    }


def _move3(mean_ndcg, name: str) -> dict:
    """Low k rewards a single leg's head, high k rewards agreement."""
    sweep = {k: float(mean_ndcg[f"rrf_k{k}_w1-1"]) for k in replay.RRF_KS}
    ties = json.loads((DIAG / f"{name}.json").read_text()).get("tie_rate_build1", {})
    return {
        "k_sweep_equal_weights": sweep,
        "best_k": max(sweep, key=sweep.get),
        "span": max(sweep.values()) - min(sweep.values()),
        "tie_rate_top10": {f"k{k}": ties.get(f"rrf_k{k}_w1-1") for k in replay.RRF_KS},
        "dbsf_minus_default": float(mean_ndcg["dbsf"] - mean_ndcg[replay.DEFAULT_ARM]),
    }


def _move4(mean_ndcg, bootstrap: dict) -> dict:
    """Prescribe the least extreme setting whose interval clears zero."""
    clearing = [arm for arm, interval in bootstrap.items() if interval["low"] > 0 and arm in REACHABLE]
    # DBSF is a different fusion method, not a milder RRF setting, so it is
    # reported on its own rather than ranked against the k and weight grid.
    ranked = sorted((arm for arm in clearing if arm.startswith("rrf_")), key=_extremity)
    return {
        "arms_clearing": len(clearing),
        "clearing_arms": ranked,
        "dbsf_clears": "dbsf" in clearing,
        "nominal_winner": str(mean_ndcg[list(REACHABLE)].idxmax()),
        "prescription": ranked[0] if ranked else replay.DEFAULT_ARM,
        "median_interval_width": float(
            np.median([v["high"] - v["low"] for a, v in bootstrap.items() if a in REACHABLE])
        )
        if bootstrap
        else 0.0,
    }


def _extremity(arm: str) -> float:
    """Distance from the default, so the mildest clearing setting wins ties."""
    k, weights = replay._parse_rrf(arm)
    return abs(np.log2(k / 2)) + abs(np.log2(weights[0] / weights[1]))


def exhibit(names=None, name: str = "wands", low: str = "rrf_k2_w1-1", high: str = "rrf_k61_w1-1"):
    """Mine one query where the two ends of the k range disagree on rank 1."""
    fused = pd.read_parquet(FUSED / f"{name}.parquet")
    docs = pd.read_parquet(CACHE / f"{name}_corpus.parquet").set_index("point_id")
    queries = pd.read_parquet(CACHE / f"{name}_queries.parquet").set_index("query_id")
    tops = fused[fused["rank"] == 0].pivot(index="query_id", columns="arm", values="point_id")
    relevance = fused[fused["rank"] == 0].pivot(index="query_id", columns="arm", values="relevance")

    disagree = tops[tops[low] != tops[high]]
    # Prefer a query where the higher k actually promotes a better document,
    # so the exhibit shows the mechanism paying off rather than just differing.
    better = disagree.index[relevance.loc[disagree.index, high] > relevance.loc[disagree.index, low]]
    chosen = str(better[0] if len(better) else disagree.index[0])

    lanes = {}
    for arm in (low, high):
        rows = fused[(fused["query_id"] == chosen) & (fused["arm"] == arm)].sort_values("rank")
        lanes[arm] = [
            {
                "rank": int(row["rank"]),
                "point_id": int(row["point_id"]),
                "text": docs.loc[int(row["point_id"]), "text"][:160],
                "fused_score": row["score"],
                "dense_rank": None if pd.isna(row["dense_rank"]) else int(row["dense_rank"]),
                "sparse_rank": None if pd.isna(row["sparse_rank"]) else int(row["sparse_rank"]),
                "dense_contribution": None if pd.isna(row["dense_contribution"]) else row["dense_contribution"],
                "sparse_contribution": None if pd.isna(row["sparse_contribution"]) else row["sparse_contribution"],
                "source": _source_label(row),
                "relevance": int(row["relevance"]),
            }
            for _, row in rows.head(10).iterrows()
        ]
    payload = {
        "corpus": name,
        "query_id": chosen,
        "query": queries.loc[chosen, "text"],
        "queries_where_they_disagree": int(len(disagree)),
        "queries_total": int(len(tops)),
        "arms": {"low_k": low, "high_k": high},
        "lanes": lanes,
    }
    (ROOT / "exhibit.json").write_text(json.dumps(payload, indent=2, default=float))
    print(f"exhibit: {name} query {chosen} '{payload['query']}' "
          f"({len(disagree)}/{len(tops)} queries disagree on rank 1)")
    for arm, rows in lanes.items():
        top = rows[0]
        print(f"  {arm:14s} rank1 = {top['point_id']} ({top['source']}, rel={top['relevance']}) "
              f"dense_rank={top['dense_rank']} sparse_rank={top['sparse_rank']}")
    return payload


def _source_label(row) -> str:
    if pd.notna(row["dense_rank"]) and pd.notna(row["sparse_rank"]):
        return "both"
    return "dense_only" if pd.notna(row["dense_rank"]) else "sparse_only"


def _append_parquet(path, frame: pd.DataFrame, keys):
    """Replace any rows sharing the frame's keys, then write the union back."""
    if path.exists():
        existing = pd.read_parquet(path)
        merged = existing.merge(frame[keys].drop_duplicates(), on=keys, how="left", indicator=True)
        existing = existing[merged["_merge"].to_numpy() == "left_only"]
        frame = pd.concat([existing, frame], ignore_index=True)
    frame.to_parquet(path, index=False)


def _merge_json(path, payload: dict):
    current = json.loads(path.read_text()) if path.exists() else {}
    current.update(payload)
    path.write_text(json.dumps(current, indent=2))


COMMANDS = {"t1": t1, "t3": t3, "t4": t4, "t5": t5, "t6": t6, "t7": t7, "t8": t8, "exhibit": exhibit, "floor": lambda a=None: floor()}

if __name__ == "__main__":
    command, *args = sys.argv[1:]
    COMMANDS[command](args or None)
