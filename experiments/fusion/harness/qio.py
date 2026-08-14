"""Index building and retrieval against a local Qdrant.

Dense and sparse query vectors are computed once per corpus and reused by every
task, so a rebuild changes the HNSW graph and nothing else.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from qdrant_client import QdrantClient, models

from . import CACHE, QDRANT_URL

DENSE_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
DENSE_DIM = 384
SPARSE_MODEL = "Qdrant/bm25"
HNSW_M = 16
HNSW_EF_CONSTRUCT = 100
FULL_SCAN_THRESHOLD_KB = 10
INDEXING_THRESHOLD_KB = 1
BASELINE_HNSW_EF = 128
DEPTH = 200


def client() -> QdrantClient:
    return QdrantClient(url=QDRANT_URL, timeout=600)


# ------------------------------------------------------------------ embedding


def dense_embed(texts, cache_path=None, batch_size: int = 256) -> np.ndarray:
    if cache_path is not None and cache_path.exists():
        return np.load(cache_path)
    from fastembed import TextEmbedding

    model = TextEmbedding(DENSE_MODEL)
    vectors = np.asarray(
        list(model.embed(list(texts), batch_size=batch_size)), dtype=np.float32
    )
    if cache_path is not None:
        np.save(cache_path, vectors)
    return vectors


def bm25_model(avg_len: float):
    from fastembed.sparse.bm25 import Bm25

    return Bm25(SPARSE_MODEL, avg_len=avg_len)


def sparse_vectors(model, texts, is_query: bool):
    """BM25 document term frequencies, or the query's flat 1.0 weights."""
    source = model.query_embed(list(texts)) if is_query else model.embed(list(texts))
    return [
        models.SparseVector(indices=e.indices.tolist(), values=e.values.tolist()) for e in source
    ]


# --------------------------------------------------------------------- indexing


def build(
    conn,
    name: str,
    corpus,
    dense: np.ndarray,
    sparse,
    wait_seconds: int = 1800,
    batch_size: int = 256,
) -> dict:
    """Recreate the collection and index every document. Returns index stats."""
    conn.delete_collection(name)
    conn.create_collection(
        collection_name=name,
        vectors_config={
            "dense": models.VectorParams(size=DENSE_DIM, distance=models.Distance.COSINE)
        },
        sparse_vectors_config={"bm25": models.SparseVectorParams(modifier=models.Modifier.IDF)},
        hnsw_config=models.HnswConfigDiff(
            m=HNSW_M,
            ef_construct=HNSW_EF_CONSTRUCT,
            # In KiloBytes, not documents, and the server rejects anything
            # under 10 (config_diff.rs:57). 10 KB is about seven 384-dim
            # vectors, so every corpus here searches the HNSW graph.
            full_scan_threshold=FULL_SCAN_THRESHOLD_KB,
        ),
        # An HNSW index is only built for segments larger than
        # indexing_threshold, which defaults to 100,000 KB
        # (optimizers_builder.rs:125). Four of the five corpora fall under
        # that, so without this line they would search by full scan and the
        # hnsw_ef sweep would measure nothing.
        optimizers_config=models.OptimizersConfigDiff(indexing_threshold=INDEXING_THRESHOLD_KB),
        quantization_config=None,
        shard_number=1,
        replication_factor=1,
    )
    conn.create_payload_index(name, "doc_id", field_schema=models.PayloadSchemaType.KEYWORD)

    # Upload batch by batch. Materialising 100k PointStructs at once turns
    # 150 MB of float32 into gigabytes of Python floats.
    point_ids = corpus.docs["point_id"].to_numpy()
    doc_ids = list(corpus.docs["doc_id"])
    for start in range(0, len(point_ids), batch_size):
        stop = min(start + batch_size, len(point_ids))
        conn.upsert(
            name,
            points=[
                models.PointStruct(
                    id=int(point_ids[i]),
                    vector={"dense": dense[i].tolist(), "bm25": sparse[i]},
                    payload={"doc_id": doc_ids[i]},
                )
                for i in range(start, stop)
            ],
            wait=True,
        )
    return _wait_indexed(conn, name, len(point_ids), wait_seconds)


def _wait_indexed(conn, name: str, expected: int, wait_seconds: int) -> dict:
    import time

    deadline = time.time() + wait_seconds
    settled, previous = 0, -1
    while time.time() < deadline:
        info = conn.get_collection(name)
        indexed = info.indexed_vectors_count or 0
        settled = settled + 1 if indexed == previous else 0
        previous = indexed
        # A fresh collection turns green before the optimizer has built any
        # HNSW graph, so wait for the indexed count to stop moving as well.
        if (
            info.status == models.CollectionStatus.GREEN
            and info.points_count == expected
            and indexed >= expected
            and settled >= 3
        ):
            return {
                "points_count": info.points_count,
                "indexed_vectors_count": info.indexed_vectors_count,
                "status": str(info.status),
            }
        time.sleep(2)
    raise TimeoutError(f"{name} did not finish indexing within {wait_seconds}s")


# -------------------------------------------------------------------- retrieval


def retrieve(
    conn,
    name: str,
    corpus,
    query_vectors,
    leg: str,
    limit: int = DEPTH,
    hnsw_ef: int = BASELINE_HNSW_EF,
    chunk: int = 64,
    search_params=None,
) -> pd.DataFrame:
    """Top-`limit` for every query on one leg, as (query_id, doc_id, rank, score).

    `search_params` replaces the dense defaults outright, which is how the
    quantization study passes `oversampling` and `rescore`.
    """
    using = "dense" if leg == "dense" else "bm25"
    if leg != "dense":
        params = None
    elif search_params is not None:
        params = search_params
    else:
        params = models.SearchParams(hnsw_ef=hnsw_ef, exact=False)
    excluded = corpus.self_doc_ids()

    rows = []
    query_ids = list(corpus.queries["query_id"])
    for start in range(0, len(query_ids), chunk):
        window = query_ids[start : start + chunk]
        requests = [
            models.QueryRequest(
                query=_as_query(query_vectors[start + offset]),
                using=using,
                limit=limit,
                params=params,
                filter=_exclusion(excluded.get(query_id)),
                with_payload=False,
            )
            for offset, query_id in enumerate(window)
        ]
        for query_id, response in zip(window, conn.query_batch_points(name, requests)):
            for rank, point in enumerate(response.points):
                rows.append((query_id, int(point.id), rank, float(point.score)))
    return pd.DataFrame(rows, columns=["query_id", "point_id", "rank", "score"])


def _as_query(vector):
    if isinstance(vector, models.SparseVector):
        return vector
    return np.asarray(vector, dtype=np.float32).tolist()


def _exclusion(doc_id):
    if doc_id is None:
        return None
    return models.Filter(
        must_not=[models.FieldCondition(key="doc_id", match=models.MatchValue(value=doc_id))]
    )


def index_check(conn, name: str, corpus, query_vectors, n_queries: int = 10) -> dict:
    """Whether an HNSW graph exists, and a corroborating traversal signal.

    `indexed_vectors_count` against `points_count` is the test: zero means no
    graph was built and every dense search is a full scan.

    The ten-query comparison at hnsw_ef 64 and 512 only corroborates. Identical
    results do not prove a full scan, because recall saturates: SciFact returns
    byte-identical lists at both settings on a graph that is demonstrably HNSW.
    So `graph_built` gates the run and `hnsw_ef_64_equals_512` is recorded.
    """
    info = conn.get_collection(name)
    indexed = info.indexed_vectors_count or 0
    sample = corpus.queries.head(n_queries)
    low = retrieve(conn, name, _head(corpus, sample), query_vectors[: len(sample)], "dense", 200, 64)
    high = retrieve(
        conn, name, _head(corpus, sample), query_vectors[: len(sample)], "dense", 200, 512
    )
    same = low[["query_id", "point_id", "rank"]].equals(high[["query_id", "point_id", "rank"]])
    return {
        "indexed_vectors_count": int(indexed),
        "points_count": int(info.points_count or 0),
        "graph_built": bool(indexed > 0 and indexed >= (info.points_count or 0)),
        "hnsw_ef_64_equals_512": bool(same),
        "queries": len(sample),
    }


def compare_runs(before: pd.DataFrame, after: pd.DataFrame, tolerance: float = 1e-4) -> dict:
    """Whether two retrieval frames agree, and where they do not.

    A bare "identical: false" is unreadable, because two runs over the same data
    routinely disagree at tied scores: fusion and search both sort on score
    alone, so a tied group comes back in whatever order the storage produced,
    and a tied group straddling the limit is cut arbitrarily. This reports the
    positions that moved and whether every one of them sits at an equal score,
    which is the difference between a reshuffle and a real change.
    """
    merged = before.merge(after, on=["query_id", "rank"], suffixes=("_before", "_after"))
    moved = merged[merged["point_id_before"] != merged["point_id_after"]]
    deviation = (merged["score_before"] - merged["score_after"]).abs()
    at_equal_score = bool(
        np.allclose(moved["score_before"], moved["score_after"], atol=tolerance, rtol=0)
    )
    return {
        "positions_compared": int(len(merged)),
        "positions_moved": int(len(moved)),
        "share_moved": float(len(moved) / len(merged)) if len(merged) else 0.0,
        "every_move_at_an_equal_score": at_equal_score if len(moved) else True,
        "max_score_deviation": float(deviation.max()) if len(merged) else 0.0,
        "identical": bool(len(moved) == 0),
        # True when the runs differ only in how tied documents were ordered.
        "equivalent_up_to_ties": bool(at_equal_score and deviation.max() <= tolerance),
    }


def _head(corpus, queries):
    from copy import copy

    trimmed = copy(corpus)
    trimmed.queries = queries
    return trimmed


def cache_path(corpus_name: str, leg: str, build_number: int):
    return CACHE / f"{corpus_name}_{leg}_b{build_number}.parquet"
