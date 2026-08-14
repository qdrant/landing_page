"""E7: the RAM boundary and the price of recovery.

The full DBPedia-entity BEIR corpus, embedded once, ingested into one
collection, then run under two container memory limits. This file owns only
E7. It imports the harness for the corpus loader and the embedding model so
E7 and E1 to E6 share one definition of both; it writes nothing that E1 to E6
read, and it runs against its own container and its own storage volume.

Phase 1 tasks, in order. `e7_phase1.sh` chains them unattended.

    python e7.py corpus         stream the zip, write frames, measure avg_len
    python e7.py embed          the embedding pass, resumable
    python e7.py queries        the 400 test queries, embedded once
    python e7.py up 10g         start the E7 container at a memory limit
    python e7.py ingest         create the collection and upload
    python e7.py ingest 100000 smoke    the same path over a slice, to prove it
    python e7.py warm           one pass of the query set
    python e7.py mem steady-10g the memory measurements, named by lifecycle point

The cell list E7a and E7b run is pre-registered in `e7_cells.py`.
"""

from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd

from harness import CACHE, ROOT
from harness import corpora as C
from harness import qio

E7 = ROOT / "e7"
E7.mkdir(parents=True, exist_ok=True)

NAME = "dbpedia-full"
COLLECTION = "dbpedia_full"
CONTAINER = "e7-qdrant"
VOLUME = "e7-qdrant-storage"
IMAGE = "qdrant/qdrant:v1.19.0"
PORT = 6370
URL = f"http://localhost:{PORT}"

DOCS = CACHE / f"{NAME}_corpus.parquet"
QUERIES = CACHE / f"{NAME}_queries.parquet"
QRELS = CACHE / f"{NAME}_qrels.parquet"
DENSE = CACHE / f"{NAME}_dense.npy"
QDENSE = CACHE / f"{NAME}_qdense.npy"
PROGRESS = CACHE / f"{NAME}_dense.progress.json"
CORPUS_JSON = E7 / "corpus.json"

EMBED_BATCH = 256
UPLOAD_BATCH = 512


def _write(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    print(f"wrote {path.relative_to(ROOT)}")


def _sh(*args: str) -> str:
    return subprocess.run(args, capture_output=True, text=True, check=True).stdout.strip()


# ------------------------------------------------------------------- corpus


CHUNK = 250_000


def corpus() -> None:
    """Write the whole 4.6M-document corpus, not the 100k sample E1 to E6 use.

    The zip is read in one streaming pass into parquet row groups. `load_beir`
    holds every document in a Python list, which is 3 GB of strings here and
    twice that while the frame is built, so only its qrels reader, its
    field recipe and its answerable-query rule are reused.
    """
    import zipfile

    import pyarrow as pa
    import pyarrow.parquet as pq

    started = time.time()
    path = C.RAW / "dbpedia-entity.zip"
    schema = pa.schema(
        [("point_id", pa.int64()), ("doc_id", pa.string()), ("text", pa.string())]
    )
    doc_ids: list[str] = []
    with zipfile.ZipFile(path) as archive:
        corpus_member, queries_member, qrels_member = C._beir_members(archive, "dbpedia-entity")
        qrels = C._read_qrels(archive, qrels_member)
        with archive.open(queries_member) as handle:
            queries = pd.DataFrame(
                [
                    {"query_id": str(row["_id"]), "text": row["text"]}
                    for row in map(json.loads, C.io.TextIOWrapper(handle, "utf-8"))
                ]
            )
        with pq.ParquetWriter(DOCS, schema) as writer, archive.open(corpus_member) as handle:
            batch: list[tuple[str, str]] = []
            for line in C.io.TextIOWrapper(handle, "utf-8"):
                row = json.loads(line)
                batch.append(
                    (
                        str(row["_id"]),
                        f"{row.get('title', '')} {row.get('text', '')}".strip(),
                    )
                )
                if len(batch) == CHUNK:
                    _flush(writer, schema, batch, len(doc_ids))
                    doc_ids.extend(d for d, _ in batch)
                    batch = []
                    print(f"  {len(doc_ids)} documents", flush=True)
            if batch:
                _flush(writer, schema, batch, len(doc_ids))
                doc_ids.extend(d for d, _ in batch)

    # Same rule as load_beir: a query whose relevant documents are all missing
    # scores zero under every arm, so it is dropped rather than left to pad.
    qrels = qrels[qrels["doc_id"].isin(set(doc_ids))].reset_index(drop=True)
    answerable = set(qrels.loc[qrels["relevance"] > 0, "query_id"])
    queries = queries[queries["query_id"].isin(answerable)].reset_index(drop=True)
    qrels = qrels[qrels["query_id"].isin(answerable)].reset_index(drop=True)
    queries.to_parquet(QUERIES, index=False)
    qrels.to_parquet(QRELS, index=False)
    loaded = time.time() - started
    print(f"corpus written in {loaded:.0f}s, measuring avg_len", flush=True)

    digest = C.hashlib.sha256("\n".join(doc_ids).encode()).hexdigest()
    del doc_ids
    lengths = _avg_len(len(qrels))
    _write(
        CORPUS_JSON,
        {
            "corpus": NAME,
            "source": {
                "file": path.name,
                "url": f"{C.BEIR_BASE}/dbpedia-entity.zip",
                "sha256": C.sha256(path),
                "bytes": path.stat().st_size,
            },
            "license": "CC BY-SA 3.0",
            "field_recipe": 'title + " " + text',
            "docs": lengths.pop("docs"),
            "queries": len(queries),
            "qrels": len(qrels),
            "relevant_per_query": round(
                int((qrels["relevance"] > 0).sum()) / max(len(queries), 1), 4
            ),
            "max_relevance": int(qrels["relevance"].max()),
            "doc_id_sha256": digest,
            **lengths,
            "load_seconds": round(loaded, 1),
        },
    )


def _flush(writer, schema, batch: list[tuple[str, str]], offset: int) -> None:
    import pyarrow as pa

    writer.write_table(
        pa.Table.from_arrays(
            [
                pa.array(range(offset, offset + len(batch)), pa.int64()),
                pa.array([d for d, _ in batch], pa.string()),
                pa.array([t for _, t in batch], pa.string()),
            ],
            schema=schema,
        )
    )


def _avg_len(_unused: int) -> dict:
    """`measure_avg_len` over 4.6M documents, one row group per process.

    The stemmer is pure Python, so processes are the only way to use more than
    one core, and the totals are sums, so chunking changes nothing.
    """
    import pyarrow.parquet as pq
    from concurrent.futures import ProcessPoolExecutor

    groups = pq.ParquetFile(DOCS).num_row_groups
    stemmed = raw = docs = 0
    with ProcessPoolExecutor(max_workers=10) as pool:
        for part in pool.map(_avg_len_chunk, range(groups)):
            stemmed += part[0]
            raw += part[1]
            docs += part[2]
    return {
        "avg_len": round(stemmed / max(docs, 1), 4),
        "avg_raw_tokens": round(raw / max(docs, 1), 4),
        "docs": docs,
    }


def _avg_len_chunk(group: int) -> tuple[int, int, int]:
    import pyarrow.parquet as pq
    from fastembed.common.utils import remove_non_alphanumeric

    texts = pq.ParquetFile(DOCS).read_row_group(group, columns=["text"]).column("text").to_pylist()
    bm25 = qio.bm25_model(256.0)
    stemmed = raw = 0
    for text in texts:
        tokens = bm25.tokenizer.tokenize(remove_non_alphanumeric(text))
        raw += len(tokens)
        stemmed += len(bm25._stem(tokens))
    return stemmed, raw, len(texts)


# ------------------------------------------------------------------ embedding


def embed() -> None:
    """Write float32 vectors straight into a memmap, resuming where it stopped.

    7.1 GB of vectors will not sit in a Python list, and the pass runs for
    hours, so the array on disk is the progress record.
    """
    import pyarrow.parquet as pq
    from fastembed import TextEmbedding

    reader = pq.ParquetFile(DOCS)
    total = reader.metadata.num_rows
    done = 0
    if PROGRESS.exists():
        saved = json.loads(PROGRESS.read_text())
        # Resuming on a row count alone would attach a stale run's vectors to a
        # rebuilt corpus's doc_ids, and every check downstream would pass. The
        # corpus digest, the model and the dimension have to match too.
        # A progress file with no identity was written by the pass that
        # introduced this check, so it is accepted once and rewritten with one.
        if "identity" in saved and saved["identity"] != _identity():
            raise SystemExit(
                f"{PROGRESS.name} was written for a different corpus or model. "
                f"Delete it and {DENSE.name} to start the pass again."
            )
        done = saved["rows"]
    if done >= total:
        print(f"embedded {total} already")
        return

    vectors = np.lib.format.open_memmap(
        DENSE,
        mode="r+" if DENSE.exists() else "w+",
        dtype=np.float32,
        shape=(total, qio.DENSE_DIM),
    )
    model = TextEmbedding(qio.DENSE_MODEL)
    started, at, group_start = time.time(), done, 0
    print(f"embedding {total - done} of {total} from row {done}", flush=True)
    for group in range(reader.num_row_groups):
        rows = reader.metadata.row_group(group).num_rows
        if group_start + rows <= done:
            group_start += rows
            continue
        # One row group at a time: 4.6M documents of text will not sit in
        # memory beside a 7.1 GB vector array for the hours this takes.
        texts = reader.read_row_group(group, columns=["text"]).column("text").to_pylist()
        for offset in range(at - group_start, rows, EMBED_BATCH):
            stop = min(offset + EMBED_BATCH, rows)
            batch = texts[offset:stop]
            vectors[group_start + offset : group_start + stop] = np.asarray(
                list(model.embed(batch, batch_size=EMBED_BATCH)), np.float32
            )
            at = group_start + stop
            if (stop // EMBED_BATCH) % 100 == 0 or stop == rows:
                vectors.flush()
                _checkpoint(at, total, done, started)
        group_start += rows
    vectors.flush()
    _checkpoint(at, total, done, started)


def _checkpoint(at: int, total: int, done: int, started: float) -> None:
    rate = (at - done) / max(time.time() - started, 1e-9)
    PROGRESS.write_text(
        json.dumps(
            {
                "rows": at,
                "total": total,
                "docs_per_second": round(rate, 1),
                "identity": _identity(),
            }
        )
    )
    left = (total - at) / max(rate, 1e-9)
    print(f"  {at}/{total}  {rate:.0f} docs/s  {left / 60:.0f} min left", flush=True)


def _identity() -> dict:
    """What the vectors on disk have to agree with: which documents, in which
    order, through which model. Carried by the progress file and asserted again
    at ingest, because a mismatch produces a collection that looks correct."""
    meta = json.loads(CORPUS_JSON.read_text())
    return {
        "doc_id_sha256": meta["doc_id_sha256"],
        "docs": meta["docs"],
        "model": qio.DENSE_MODEL,
        "dim": qio.DENSE_DIM,
        "source_sha256": meta["source"]["sha256"],
    }


def queries() -> None:
    """The 400 test queries, embedded once with the corpus model."""
    from fastembed import TextEmbedding

    frame = pd.read_parquet(QUERIES)
    model = TextEmbedding(qio.DENSE_MODEL)
    vectors = np.asarray(
        list(model.embed([str(t) for t in frame["text"]], batch_size=EMBED_BATCH)), np.float32
    )
    np.save(QDENSE, vectors)
    print(f"wrote {QDENSE.name} {vectors.shape}")


# ------------------------------------------------------------------ container


def up(limit: str = "14g") -> None:
    """Start the E7 container at a memory limit, on its own volume and port.

    The five E1 to E6 collections live in `fusion-qdrant` and are not touched.
    Recreating this container at a different limit keeps the collection,
    because the storage is a named volume.
    """
    # A graceful stop first: `rm -f` is a crash shutdown, and reopening the
    # volume would then start with WAL recovery and an optimizer pass that
    # contaminate the regime the new limit is supposed to isolate.
    subprocess.run(["docker", "stop", "-t", "120", CONTAINER], capture_output=True)
    subprocess.run(["docker", "rm", "-f", CONTAINER], capture_output=True)
    _sh("docker", "volume", "create", VOLUME)
    _sh(
        "docker", "run", "-d",
        "--name", CONTAINER,
        "--memory", limit,
        # Match the limit so the container cannot page out to the VM's swap and
        # hide the boundary the experiment is built to measure.
        "--memory-swap", limit,
        "-p", f"{PORT}:6333",
        "-p", f"{PORT + 1}:6334",
        "-v", f"{VOLUME}:/qdrant/storage",
        IMAGE,
    )
    for _ in range(60):
        try:
            _client().get_collections()
            print(f"{CONTAINER} up at {limit}, {URL}")
            return
        except Exception:
            time.sleep(1)
    raise SystemExit(f"{CONTAINER} did not answer on {URL}")


def cold(limit: str = "4g") -> None:
    """Start a cell from a controlled cache state, which is the only way a
    memory limit means anything here.

    Page cache is charged to the cgroup that first faults a page in, and the
    charge survives the container that made it. Recreating a container over a
    warm volume therefore hands it gigabytes of resident pages it is never
    billed for: measured at 4 GiB, the cgroup reported 32 MB of file cache
    while the process held 9.49 GB, the limit was never reached, and 400
    queries ran in 2.9 s instead of 158 s. Dropping the cache with the files
    still mapped does not help either, because `drop_caches` frees only clean
    unmapped pages. The server has to stop first.
    """
    subprocess.run(["docker", "stop", "-t", "120", CONTAINER], capture_output=True)
    before = _vm_cache()
    _sh(
        "docker", "run", "--rm", "--privileged", "--pid=host", "alpine",
        "sh", "-c", "sync; echo 3 > /proc/sys/vm/drop_caches",
    )
    after = _vm_cache()
    print(f"VM page cache {before / 1e9:.2f} GB -> {after / 1e9:.2f} GB")
    if after > 2e9:
        raise SystemExit(f"page cache still {after / 1e9:.2f} GB; something is holding the files")
    # The host layer too, where it is permitted. macOS caches the VM's disk
    # image, so a guest-only drop still leaves reads that never reach the SSD.
    # `purge` needs sudo and may refuse without a terminal, so the outcome is
    # recorded rather than assumed either way.
    host = subprocess.run(["sudo", "-n", "purge"], capture_output=True, text=True)
    host_dropped = host.returncode == 0
    print(f"host page cache dropped: {host_dropped}")
    up(limit)
    _wait_ready()
    _write(
        E7 / f"cold-{limit}.json",
        {
            "limit": limit,
            "vm_cache_before_bytes": before,
            "vm_cache_after_bytes": after,
            "host_purge_ran": host_dropped,
            "host_swap_after": _sh("sysctl", "-n", "vm.swapusage"),
        },
    )


def _vm_cache() -> int:
    """`Cached` in the VM, read from a throwaway container so it can be taken
    while the E7 container is stopped."""
    out = _sh("docker", "run", "--rm", "alpine", "awk", "/^Cached:/{print $2*1024}", "/proc/meminfo")
    return int(out)


def _wait_ready(collection: str = COLLECTION, wait_seconds: int = 600) -> None:
    """Ready means it answers a real query with its own shard active.

    The status field is not the test. A collection whose shard reports Active
    and which serves a query can report `grey`, and waiting for the literal
    `green` polled a perfectly healthy collection for twenty minutes.
    """
    import numpy as np
    from qdrant_client import models

    conn = _client()
    probe = np.load(QDENSE)[0].tolist()
    deadline = time.time() + wait_seconds
    while time.time() < deadline:
        try:
            info = conn.get_collection(collection)
            shards = conn.collection_cluster_info(collection).local_shards
            conn.query_points(collection, query=probe, using="dense", limit=1)
            # Compare enum values, not their repr. `str(state)` is "Active",
            # not "ReplicaState.ACTIVE", and guessing that spelling wrong made
            # this poll a healthy collection until it was killed.
            if shards and all(s.state == models.ReplicaState.ACTIVE for s in shards):
                print(f"{collection} ready, {info.points_count} points, status {info.status}")
                return
        except Exception:
            pass
        time.sleep(5)
    raise SystemExit(f"{collection} not ready within {wait_seconds}s")


def _client():
    from qdrant_client import QdrantClient

    return QdrantClient(url=URL, timeout=3600)


# -------------------------------------------------------------------- ingest


def ingest(rows: str = "all", collection: str = COLLECTION) -> None:
    """Create the collection and stream every document into it.

    Dense only: a BM25 prefetch would hold about 1.5 GB of page cache the
    experiment is trying to starve, so under the tight limit the evicted
    structure could be the sparse index rather than the originals.

    Indexing is off during the upload and switched on afterwards, so the HNSW
    graph is built once instead of being rebuilt under every optimizer pass.
    That also makes the build and optimization times E7b reports separable.
    """
    from qdrant_client import models

    docs = pd.read_parquet(DOCS, columns=["point_id", "doc_id"])
    dense = np.load(DENSE, mmap_mode="r")
    if len(dense) != len(docs):
        raise SystemExit(f"{len(dense)} vectors against {len(docs)} documents")
    # The vectors and the doc_ids they are about to be paired with have to come
    # from the same corpus, checked against the digest rather than the count.
    identity = _identity()
    digest = C.hashlib.sha256("\n".join(docs["doc_id"]).encode()).hexdigest()
    if digest != identity["doc_id_sha256"]:
        raise SystemExit("the parquet's doc_ids do not match the recorded corpus digest")
    if dense.dtype != np.float32 or dense.shape[1] != qio.DENSE_DIM:
        raise SystemExit(f"vectors are {dense.dtype} {dense.shape}, not float32 x {qio.DENSE_DIM}")
    # A row count runs the same path over a slice, which is how the upload is
    # proved before the overnight one starts.
    total = len(docs) if rows == "all" else int(rows)
    # A slice needs only its own rows embedded; the full ingest needs all of them.
    saved = json.loads(PROGRESS.read_text()) if PROGRESS.exists() else {}
    if (saved.get("rows") or 0) < total:
        raise SystemExit(f"the embedding pass reached {saved.get('rows')} of {total} needed")

    conn = _client()
    conn.delete_collection(collection)
    conn.create_collection(
        collection_name=collection,
        vectors_config={
            "dense": models.VectorParams(size=qio.DENSE_DIM, distance=models.Distance.COSINE)
        },
        hnsw_config=models.HnswConfigDiff(
            m=qio.HNSW_M,
            ef_construct=qio.HNSW_EF_CONSTRUCT,
            full_scan_threshold=qio.FULL_SCAN_THRESHOLD_KB,
        ),
        # 0 disables indexing for the upload (config.rs:253-259); the real
        # threshold goes on afterwards.
        optimizers_config=models.OptimizersConfigDiff(
            indexing_threshold=0, default_segment_number=SEGMENTS
        ),
        quantization_config=None,
        shard_number=1,
        replication_factor=1,
    )
    conn.create_payload_index(collection, "doc_id", field_schema=models.PayloadSchemaType.KEYWORD)

    point_ids = docs["point_id"].to_numpy()
    doc_ids = list(docs["doc_id"])
    started = time.time()
    for start in range(0, total, UPLOAD_BATCH):
        stop = min(start + UPLOAD_BATCH, total)
        conn.upsert(
            collection,
            points=[
                models.PointStruct(
                    id=int(point_ids[i]),
                    vector={"dense": dense[i].tolist()},
                    payload={"doc_id": doc_ids[i]},
                )
                for i in range(start, stop)
            ],
            wait=False,
        )
        if stop % (UPLOAD_BATCH * 200) == 0 or stop == total:
            rate = stop / max(time.time() - started, 1e-9)
            print(f"  {stop}/{total}  {rate:.0f} docs/s", flush=True)
    upload_seconds = time.time() - started

    # `wait=False` returns before a batch is applied, so the count is the proof
    # that nothing was dropped, and it has to be true before indexing starts.
    deadline = time.time() + 1800
    while (conn.get_collection(collection).points_count or 0) < total:
        if time.time() > deadline:
            raise SystemExit(
                f"only {conn.get_collection(collection).points_count} of {total} points landed"
            )
        time.sleep(10)

    conn.update_collection(
        collection,
        optimizers_config=models.OptimizersConfigDiff(
            indexing_threshold=qio.INDEXING_THRESHOLD_KB
        ),
    )
    indexed = time.time()
    stats = _wait_green(conn, collection, total)
    _write(
        E7 / ("ingest.json" if rows == "all" else f"ingest-{rows}.json"),
        {
            "collection": collection,
            "container": CONTAINER,
            "memory_limit": _limit(),
            "documents": total,
            "segments": SEGMENTS,
            "vectors": "dense only, no sparse prefetch",
            "upload_seconds": round(upload_seconds, 1),
            "index_seconds": round(time.time() - indexed, 1),
            **stats,
        },
    )


SEGMENTS = 7


def _wait_green(conn, collection: str, expected: int, wait_seconds: int = 21600) -> dict:
    """Green, every point present, every vector indexed, and the count settled.

    Failing on a deadline rather than looping forever, because this runs
    unattended and a stuck optimizer should end the night with an error rather
    than with a script that is still sleeping in the morning.
    """
    from qdrant_client import models

    deadline = time.time() + wait_seconds
    settled, previous = 0, -1
    while time.time() < deadline:
        info = conn.get_collection(collection)
        indexed = info.indexed_vectors_count or 0
        settled = settled + 1 if indexed == previous else 0
        previous = indexed
        if (
            info.status == models.CollectionStatus.GREEN
            and info.points_count == expected
            and indexed >= expected
            and settled >= 3
        ):
            # The configuration is recorded with the counts, so a later run can
            # show it measured the graph and placement it says it measured.
            return {
                "points_count": info.points_count,
                "indexed_vectors_count": indexed,
                "status": str(info.status),
                "segments_count": info.segments_count,
                "config": json.loads(info.config.model_dump_json()),
            }
        print(f"  indexing {indexed}/{expected} {info.status}", flush=True)
        time.sleep(30)
    raise SystemExit(f"{collection} did not settle within {wait_seconds}s")


def warm(label: str = "warm", depth: str = "200", collection: str = COLLECTION) -> None:
    """One pass of the query set at the cells' candidate depth, timed.

    The depth matters: a pass at `limit=10` never exercises the rescore path a
    cell measures, so it would warm the wrong pages. The timing is written to
    an artifact rather than printed, because a number that lives only in a
    terminal cannot be checked against anything later.
    """
    from qdrant_client import models

    conn = _client()
    vectors = np.load(QDENSE)
    per_query = []
    started = time.time()
    for vector in vectors:
        at = time.time()
        conn.query_points(
            collection,
            query=vector.tolist(),
            using="dense",
            limit=int(depth),
            search_params=models.SearchParams(hnsw_ef=qio.BASELINE_HNSW_EF),
        )
        per_query.append(time.time() - at)
    total = time.time() - started
    ordered = sorted(per_query)
    _write(
        E7 / f"pass-{label}.json",
        {
            "label": label,
            "collection": collection,
            "queries": len(vectors),
            "depth": int(depth),
            "hnsw_ef": qio.BASELINE_HNSW_EF,
            "total_seconds": round(total, 3),
            "mean_ms": round(1000 * total / len(vectors), 3),
            "p50_ms": round(1000 * ordered[len(ordered) // 2], 3),
            "p95_ms": round(1000 * ordered[int(len(ordered) * 0.95)], 3),
            "max_ms": round(1000 * ordered[-1], 3),
            "memory_limit": _limit(),
        },
    )
    print(f"{label}: {len(vectors)} queries in {total:.1f}s at depth {depth}")


# --------------------------------------------------------------------- memory


def mem(label: str = "steady") -> None:
    """Named measurements, never one footprint.

    Container RSS and the cgroup counter answer different questions: RSS is
    what the process holds, `memory.current` adds the page cache the mmapped
    vectors are read through, and that is the number the limit acts on.
    """
    stats = _sh(
        "docker", "stats", "--no-stream", "--format", "{{.MemUsage}}|{{.MemPerc}}", CONTAINER
    )
    # `memory.events` and the refault counters in `memory.stat` say whether the
    # limit reclaimed anything, and `io.stat` says whether the reclaim turned
    # into real block reads. A run that shows an OOM kill or sustained high
    # pressure is dropped rather than read as a slow tier.
    inside = {
        key: _in_container(f"cat /sys/fs/cgroup/{key}")
        for key in (
            "memory.current",
            "memory.peak",
            "memory.max",
            "memory.swap.current",
            "memory.events",
            "memory.events.local",
            "io.stat",
        )
    }
    stat = _in_container(
        "grep -E '^(file|inactive_file|active_file|anon|slab|pagetables|sock|"
        "workingset_refault_file|workingset_activate_file|pgmajfault|pgscan|pgsteal) '"
        " /sys/fs/cgroup/memory.stat"
    )
    inside["memory.stat"] = stat
    payload = {
        "label": label,
        "at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "container": CONTAINER,
        "docker_memory_limit": _limit(),
        "docker_stats_mem_usage": stats,
        "cgroup": inside,
        # PID 1 is the entrypoint shell, so the server's own resident set has
        # to be found by name rather than read off the init process.
        "qdrant_rss_bytes": int(_in_container(
            "for p in /proc/[0-9]*; do "
            "if [ \"$(cat $p/comm 2>/dev/null)\" = qdrant ]; then "
            "awk '/^VmRSS/{print $2*1024}' $p/status; fi; done"
        ) or 0),
        "storage_bytes": int(_in_container("du -s --block-size=1 /qdrant/storage | cut -f1")),
        "storage_apparent_bytes": int(_in_container("du -sb /qdrant/storage | cut -f1")),
        "storage_breakdown": _in_container(
            "du -sb /qdrant/storage/collections/*/*/* 2>/dev/null", allow_empty=True
        ),
        # Residency is measured, not inferred from the placement label: the file
        # page cache the cgroup holds, against what the vector storage occupies
        # on disk. That ratio is what says a limit fits or does not.
        "resident": _residency(stat),
        "host": _host(),
    }
    path = E7 / f"memory-{label}.json"
    _write(path, payload)
    print(json.dumps(payload["cgroup"], indent=2))
    return payload


# Qdrant keeps the originals and the quantized copy in separate files inside
# one directory per segment, so the structures the claims scope to can be sized
# from the filesystem: `matrix.dat` is the float32 originals, `quantized.data`
# the quantized copy, `vector_index-dense` the HNSW graph.
STRUCTURES = {
    "originals": "segments/*/vector_storage-dense/matrix.dat",
    "quantized": "segments/*/vector_storage-dense/quantized.data",
    "graph": "segments/*/vector_index-dense",
    "payload": "segments/*/payload_storage",
    "id_tracker": "segments/*/id_tracker.mappings",
}


def _residency(stat: str) -> dict:
    """File page cache the cgroup holds, against what each structure occupies
    on disk. A `cached` original that is not in `file` was evicted anyway, so
    the rule reads off this rather than off the placement label.

    The counters come from the caller's single read of `memory.stat`. Reading
    it twice produced an artifact quoting one counter at two values, four
    refaults apart, which reads as a discrepancy rather than as a live counter.
    """
    cache = {line.split()[0]: int(line.split()[1]) for line in stat.splitlines()}
    root = "/qdrant/storage/collections/*/*"
    # Apparent size and allocated blocks, because Qdrant preallocates payload
    # storage sparsely: 242 MB apparent against 14.5 MB on disk at 100k points.
    # The footprint claim uses blocks; the cache comparison uses the dense
    # vector files, where the two agree.
    on_disk, allocated = {}, {}
    for name, pattern in STRUCTURES.items():
        for label, flag, into in (("apparent", "-scb", on_disk), ("blocks", "-sc --block-size=1", allocated)):
            out = _in_container(
                f"du {flag} {root}/{pattern} 2>/dev/null | tail -1 | cut -f1", allow_empty=True
            )
            into[name] = int(out) if out.isdigit() else 0
    total = sum(allocated.values())
    blocks = int(_in_container("du -s --block-size=1 /qdrant/storage | cut -f1"))
    return {
        "file_cache_bytes": cache.get("file", 0),
        "active_file_bytes": cache.get("active_file", 0),
        "inactive_file_bytes": cache.get("inactive_file", 0),
        "workingset_refault_file": cache.get("workingset_refault_file", 0),
        "pgmajfault": cache.get("pgmajfault", 0),
        "apparent_bytes": on_disk,
        "on_disk_bytes": allocated,
        "on_disk_total_bytes": total,
        # Against the whole storage footprint rather than the five structures,
        # because the cgroup's file cache also holds the WAL and the segment
        # metadata, which would push a per-structure ratio above 1.
        "storage_blocks_bytes": blocks,
        "share_of_storage_cached": round(cache.get("file", 0) / blocks, 4) if blocks else None,
    }


def _in_container(command: str, allow_empty: bool = False) -> str:
    """A silently empty reading looks like zero block reads, which is the one
    wrong answer this experiment cannot afford, so a failed read raises."""
    out = subprocess.run(
        ["docker", "exec", CONTAINER, "sh", "-c", command], capture_output=True, text=True
    )
    if not allow_empty and (out.returncode != 0 or not out.stdout.strip()):
        raise SystemExit(f"reading {command!r} in {CONTAINER} failed: {out.stderr.strip()}")
    return out.stdout.strip()


def _limit() -> str:
    return _sh("docker", "inspect", "-f", "{{.HostConfig.Memory}}/{{.HostConfig.MemorySwap}}", CONTAINER)


def _host() -> dict:
    """The machine the numbers are true of, recorded with them."""
    swap = _sh("sysctl", "-n", "vm.swapusage")
    device = _sh("df", "-h", str(ROOT)).splitlines()[-1]
    return {
        "cpu": _sh("sysctl", "-n", "machdep.cpu.brand_string"),
        # Reclaim behaviour depends on the kernel and on whether swap exists,
        # so both are recorded with every reading rather than assumed.
        "vm_kernel": _sh("docker", "run", "--rm", "alpine", "uname", "-a"),
        "docker_version": _sh("docker", "version", "--format", "{{.Server.Version}}"),
        "vm_swap_bytes": int(
            _sh("docker", "run", "--rm", "alpine", "awk", "/^SwapTotal:/{print $2*1024}",
                "/proc/meminfo")
        ),
        "vm_page_cache_bytes": _vm_cache(),
        "cores": int(_sh("sysctl", "-n", "hw.ncpu")),
        "memory_bytes": int(_sh("sysctl", "-n", "hw.memsize")),
        "host_swap": swap,
        "docker_vm_memory_bytes": int(_sh("docker", "info", "--format", "{{.MemTotal}}")),
        "storage_device": device,
        "image": IMAGE,
    }


TASKS = {
    "cold": cold,
    "corpus": corpus,
    "embed": embed,
    "queries": queries,
    "up": up,
    "ingest": ingest,
    "warm": warm,
    "mem": mem,
}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in TASKS:
        raise SystemExit(f"usage: python e7.py [{' | '.join(TASKS)}] [arg]")
    TASKS[sys.argv[1]](*sys.argv[2:])
