---
title: Prevent Unoptimized Usage
date: 2026-08-21T16:37:03+02:00
short_description: "Defer visibility of unindexed points to stop bulk uploads from slowing down search."
description: "Use the prevent_unoptimized optimizer setting to stop bulk uploads and config changes from slowing down search, and see what it costs in recall."
weight: 34
goal: Operations
stack:
  - Python
example_resources:
  - label: Open Notebook
    url: https://githubtocolab.com/qdrant/examples/blob/master/prevent_unoptimized_usage/prevent_unoptimized.ipynb
---

# Prevent Unoptimized Usage

| Time: 20 min | Level: Intermediate | Output: [GitHub](https://github.com/qdrant/examples/blob/master/prevent_unoptimized_usage/prevent_unoptimized.ipynb) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/prevent_unoptimized_usage/prevent_unoptimized.ipynb) |
| --- | ----------- | ----------- | ----------- |

After a bulk upload or a configuration change, a Qdrant collection can see higher search latency for a while.
Ongoing optimizations create unindexed segments, and a query that lands on one of those segments needs a full scan to return results.

## Two Fixes on Two Different Paths

Up through Qdrant v1.17, the fix lived on the read path: [`indexed_only`](/documentation/search/low-latency-search/#query-indexed-data-only) is a search parameter that tells Qdrant to search only fully optimized segments and skip unindexed ones.

The tradeoff is that points can blink: a point can appear briefly in a small segment, then disappear from results once that segment crosses the indexing threshold and starts optimizing, until the optimization finishes.

Qdrant v1.17.1 added a second fix on the write path: the experimental [`prevent_unoptimized`](/documentation/ops-optimization/optimizer/#prevent-reads-from-large-unindexed-segments) optimizer setting.
Once a segment starts optimizing, new points added to it stay in a deferred state until the segment finishes optimizing and becomes searchable.
Qdrant still writes deferred points to persistent storage, so no data is lost, it just holds them back from search until they are ready.

This tutorial shows how to turn on `prevent_unoptimized`, how to combine it with uploads, how to monitor optimization progress, and what it costs in recall.
The accompanying [notebook](https://github.com/qdrant/examples/blob/master/prevent_unoptimized_usage/prevent_unoptimized.ipynb) runs the same steps against a live cluster.

<aside role="alert"><code>prevent_unoptimized</code> is an experimental feature. Its behavior may change in future releases, and it must be used with care, since it trades result completeness for latency. See the tradeoffs at the end of this tutorial.</aside>

## Prerequisites

Install the Qdrant client, plus `huggingface-hub` and `polars` to download and process the dataset used in this tutorial.

```bash
pip install -q qdrant-client huggingface-hub polars
```

Create a [Free Tier Qdrant Cloud cluster](https://cloud.qdrant.io/) and instantiate an async client with a timeout longer than the default.

```python
from qdrant_client import AsyncQdrantClient
from getpass import getpass

client = AsyncQdrantClient(
    url=getpass("Qdrant URL:"),
    api_key=getpass("Qdrant API key:"),
    timeout=60,
    prefer_grpc=True,
)
```

We run search and optimization monitoring concurrently against the same client, so the async client keeps those calls from blocking each other. Preferring gRPC over REST also helps throughput during the bulk upload.

## Create Two Collections

Create two collections of 768-dimensional vectors, one with `prevent_unoptimized` enabled and one without, to compare query latency and optimization time between them.

```python
from qdrant_client import models

async def create_collection(
    collection_name: str, prevent_unoptimized: bool = True
) -> None:
    await client.create_collection(
        collection_name=collection_name,
        vectors_config=models.VectorParams(
            size=768, distance=models.Distance.COSINE
        ),
        optimizers_config=models.OptimizersConfigDiff(
            prevent_unoptimized=prevent_unoptimized
        ),
    )

await create_collection("prevent-unoptimized")
await create_collection("allow-unoptimized", prevent_unoptimized=False)
```

## Download and Upload the Dataset

Download [`ashraq/cohere-wiki-embedding-100k`](https://huggingface.co/datasets/ashraq/cohere-wiki-embedding-100k) from Hugging Face, 100,000 pre-embedded Wikipedia passages, and load it with `polars`.

```python
from huggingface_hub import snapshot_download
import polars as pl

data_path = snapshot_download(
    repo_id="ashraq/cohere-wiki-embedding-100k",
    repo_type="dataset",
    allow_patterns=["data/train-*-of-*.parquet"],
)
data = pl.read_parquet(
    source=f"{data_path}/data/train-*-of-*.parquet", columns=["emb"]
)
```

Upload the embeddings in batches of 1,000 points to each collection, and time the upload. Optimization starts while points are still being uploaded, so the upload time is part of the total time to a green collection.

```python
import time
import uuid

async def upload_points(collection_name: str, df: pl.DataFrame) -> float:
    start = time.perf_counter()
    for batch in df.iter_slices(1000):
        points = [
            models.PointStruct(id=str(uuid.uuid4()), vector=row["emb"])
            for row in batch.iter_rows(named=True)
        ]
        await client.upsert(
            collection_name=collection_name, points=points, wait=False
        )
    return time.perf_counter() - start
```

When uploading with `prevent_unoptimized` enabled, set `wait=False`. With `wait=True`, each upsert call blocks until its points become visible, which means until the segment they belong to finishes optimizing. On a bulk upload this stalls the whole loop and can time out the client. This does not apply to the Rust or Go SDKs, or to the REST API, since they default to `wait=False` already. See [Effect on `wait=true`](/documentation/ops-optimization/optimizer/#effect-on-waittrue) for the full explanation.

## Monitor Optimization Progress

Poll `get_collection` for the collection status and the number of deferred points, and `get_optimizations` for running and queued optimization jobs. Treat the optimization as finished only when the collection is green, no points are deferred, nothing is running or queued, and this has held for a few polls in a row. Checking running and queued jobs alone is not enough: right after a `wait=False` upload, updates can still be waiting in the update queue while no optimization has been scheduled yet.

```python
import asyncio

async def get_optimizations_progress(
    signal: asyncio.Event, collection_name: str, stable_polls: int = 3
) -> float:
    start = time.perf_counter()
    stable = 0
    last_state = None
    while stable < stable_polls:
        optimizations, info = await asyncio.gather(
            client.get_optimizations(collection_name=collection_name, with_="queued"),
            client.get_collection(collection_name=collection_name),
        )
        queue = info.update_queue
        deferred = (queue.deferred_points or 0) if queue else 0
        running = len(optimizations.running)
        queued = len(optimizations.queued or [])
        # print only when the status or the job counts change
        state = (info.status, running, queued)
        if state != last_state:
            print(
                f"Status: {info.status}, deferred points: {deferred}, "
                f"running: {running}, queued: {queued}"
            )
            last_state = state
        done = (
            info.status == models.CollectionStatus.GREEN
            and deferred == 0
            and running == 0
            and queued == 0
        )
        stable = stable + 1 if done else 0
        if stable < stable_polls:
            await asyncio.sleep(0.5)
    signal.set()
    # do not count the polls spent confirming that the state is stable
    return time.perf_counter() - start - (stable_polls - 1) * 0.5
```

The same information is available without the client, with a `GET` request to `/collections/{collection_name}/optimizations`, or to `/collections/{collection_name}` and reading `.update_queue.deferred_points`. It also feeds [telemetry and metrics](/documentation/ops-monitoring/monitoring/), so the same numbers can back a dashboard or an alert.

## Send Search Queries During Optimization

While optimization runs, repeatedly query both collections with 1,000 sampled vectors and record each query's latency, until the optimization signal fires. The loop checks the signal after every query, so no latency sample is collected after optimization has finished.

```python
queries = data.sample(1000)["emb"].to_list()

async def query(
    signal: asyncio.Event, collection_name: str, queries: list
) -> tuple[list[float], float]:
    start = time.perf_counter()
    latencies = []
    while True:
        for q in queries:
            q_start = time.perf_counter()
            await client.query_points(collection_name=collection_name, query=q)
            latencies.append(time.perf_counter() - q_start)
            if signal.is_set():
                break
        if signal.is_set():
            break
    return latencies, time.perf_counter() - start
```

Run the experiment on one collection at a time, so the two do not compete for the same cluster resources. For each collection, upload the points and record the upload time, then run the query loop and the optimization monitor concurrently, so query latency is measured while the collection is still optimizing. The optimization time covers the period after the upload returns, and the total time adds the upload time to it.

```python
async def query_and_optimize(
    collection_name: str, queries: list, upload_time: float
) -> dict:
    # one signal per collection, so the two runs never interfere with each other
    signal = asyncio.Event()
    opt_time, (latencies, query_time) = await asyncio.gather(
        get_optimizations_progress(signal, collection_name),
        query(signal, collection_name, queries),
    )
    return {
        "upload_time": upload_time,
        "total_optimization_time": opt_time,
        "total_time": upload_time + opt_time,
        "total_query_time": query_time,
        "query_latencies": latencies,
    }

upload_time = await upload_points("prevent-unoptimized", data)
stats_prevent = await query_and_optimize(
    "prevent-unoptimized", queries, upload_time
)

upload_time = await upload_points("allow-unoptimized", data)
stats_unopt = await query_and_optimize("allow-unoptimized", queries, upload_time)
```

### Why We Poll and Query Concurrently

`query_and_optimize` runs `get_optimizations_progress` and `query` at the same time with `asyncio.gather`, rather than one after the other. This is deliberate and mirrors what actually happens in production. Searches don't pause while a collection drains its optimization backlog after a bulk load: traffic keeps coming, and it competes with indexing, merging, and vacuuming for the same CPU and I/O resources.

Running the two loops concurrently is also what lets us measure the effect we actually care about: query latency while the collection is under optimization pressure. `get_optimizations_progress` polls `/collections/{collection_name}/optimizations` (plus `get_collection` for `deferred_points`) every 0.5 seconds and sets the `asyncio.Event` once the collection is green, nothing is running or queued, and no points are deferred. The `query` loop checks that same event after every query and stops as soon as optimizations have fully drained, so every latency sample collected corresponds to a moment where the segments were still being worked on.

With `prevent_unoptimized=True`, watch `deferred_points` during this phase: a nonzero count is expected while segments are being optimized, since new points written to an optimizing segment are held back from search until that segment is ready. It is fine for this number to be high temporarily, as long as it drains to zero once the corresponding optimizations complete.

## Measured Result

Against a 768-dimensional, 100,000-point collection on a Qdrant Cloud Free Tier cluster, `prevent_unoptimized` got the collection to green about 11% sooner and lowered query latency while the collection was optimizing. The total time covers the upload plus the optimization that remained after the upload returned, because optimization starts while points are still being uploaded:

| Setting | Upload | Optimization After Upload | Total to Green | p50 Latency | p95 Latency | p99 Latency | Throughput |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `prevent_unoptimized=true` | 35.0s | 198.9s | 233.8s | 0.117s | 0.181s | 0.185s | 7.34 qps |
| `prevent_unoptimized=false` | 36.0s | 226.4s | 262.4s | 0.182s | 0.203s | 0.210s | 5.86 qps |

Uploads take about the same time with both settings, so the difference in total time comes from optimization. Median latency is 36% lower and throughput is 25% higher. With the setting off, queries scan large unindexed segments while the optimizer is still building the index, competing with it for CPU and I/O. With the setting on, those segments are skipped until they are indexed.

The deferred point count shows what this costs. With `prevent_unoptimized=true`, the monitor reports a nonzero count that drains as segments finish optimizing:

```text
Status: yellow, deferred points: 78990, running: 2, queued: 1
Status: yellow, deferred points: 47332, running: 1, queued: 1
Status: yellow, deferred points: 47332, running: 2, queued: 0
Status: yellow, deferred points: 27666, running: 1, queued: 0
Status: green, deferred points: 0, running: 0, queued: 0
```

With `prevent_unoptimized=false`, the count stays at zero throughout, because every uploaded point is searchable, indexed or not. The optimization progresses in a similar way in both cases. What changes is how many points are searchable while it runs.

## Tradeoffs

The faster optimization and lower query latency might suggest `prevent_unoptimized` is always the right call. It is not the full story: by definition, `prevent_unoptimized` withholds points in segments that have not finished optimizing, from search results.

This means searches return fewer results, if any, and are limited to points that were uploaded first, which is also a freshness problem: recently written data will not show up until its segment is done optimizing.

A temporary loss of results and recall is often acceptable in smaller collections with short optimization times, where `prevent_unoptimized` is a clear latency win. In bigger collections with longer optimization times, the same setting can leave users looking at partial results for a long time, until every segment is fully optimized. Weigh that against your collection's write volume and segment size before turning it on.

On a replicated collection, `prevent_unoptimized` also makes points blink across replicas: a deferred point becomes visible on each replica at a slightly different time, so successive requests for the same query can land on different replicas and see a point appear, disappear, and reappear. Pin a client's reads to one replica with the `X-Qdrant-Route-Affinity` header to avoid this. See [Read Affinity](/documentation/scaling/consistency-guarantees/#read-affinity) for details.

## Related Reading

- A deep dive on the Qdrant optimizer and its impact on latency: [Tuning Qdrant Optimizer for Predictable Search Latency](/documentation/operate-and-maintain/predictable-search-latency/)
- Both mechanisms compared side by side: [Query Indexed Data Only](/documentation/search/low-latency-search/#query-indexed-data-only)
- Full mechanics and configuration: [Prevent Reads from Large Unindexed Segments](/documentation/ops-optimization/optimizer/#prevent-reads-from-large-unindexed-segments)
- Deferred point counts and optimizer telemetry: [Monitoring](/documentation/ops-monitoring/monitoring/)
