---
title: Prevent Unoptimized Usage
short_description: "Defer visibility of unindexed points to stop bulk uploads from slowing down search."
description: "Use the prevent_unoptimized optimizer setting to stop bulk uploads and config changes from slowing down search, and see what it costs in recall."
weight: 34
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

Create a [Free Tier Qdrant Cloud cluster](https://cloud.qdrant.io/) and instantiate an async client with a long timeout, since we upload 100,000 vectors in this tutorial.

```python
from qdrant_client import AsyncQdrantClient
from getpass import getpass

client = AsyncQdrantClient(
    url=getpass("Qdrant URL:"),
    api_key=getpass("Qdrant API key:"),
    timeout=6000,
    prefer_grpc=True,
)
```

We run search and optimization monitoring concurrently against the same client, so the async client keeps those calls from blocking each other. Preferring gRPC over REST also helps throughput during the bulk upload.

## Create Two Collections

Create two collections of 768-dimensional vectors, one with `prevent_unoptimized` enabled and one without, to compare query latency and optimization time between them.

```python
from qdrant_client import models

async def create_collection(collection_name: str, prevent_unoptimized: bool = True) -> None:
    await client.create_collection(
        collection_name=collection_name,
        vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
        optimizers_config=models.OptimizersConfigDiff(prevent_unoptimized=prevent_unoptimized),
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
data = pl.read_parquet(source=f"{data_path}/data/train-*-of-*.parquet", columns=["emb"])
```

Upload the embeddings in batches of 1,000 points to each collection.

```python
import uuid

async def upload_points(collection_name: str, df: pl.DataFrame) -> None:
    for batch in df.iter_slices(1000):
        points = [
            models.PointStruct(id=str(uuid.uuid4()), vector=row["emb"])
            for row in batch.iter_rows(named=True)
        ]
        await client.upsert(collection_name=collection_name, points=points, wait=False)
```

When uploading with `prevent_unoptimized` enabled, set `wait=False`. With `wait=True`, each upsert call blocks until its points become visible, which means until the segment they belong to finishes optimizing. On a bulk upload this stalls the whole loop and can time out the client. This does not apply to the Rust or Go SDKs, or to the REST API, since they default to `wait=False` already. See [Effect on `wait=true`](/documentation/ops-optimization/optimizer/#effect-on-waittrue) for the full explanation.

## Monitor Optimization Progress

Poll `get_collection` for the number of deferred points, and `get_optimizations` for running and queued optimization jobs, until both queues drain.

```python
import asyncio
import time

async def get_optimizations_progress(signal: asyncio.Event, collection_name: str) -> float:
    start = time.perf_counter()
    while True:
        optimizations, info = await asyncio.gather(
            client.get_optimizations(collection_name=collection_name, with_="completed,queued,idle_segments"),
            client.get_collection(collection_name=collection_name),
        )
        deferred = info.update_queue.deferred_points if info.update_queue else 0
        print(f"Deferred points: {deferred or 0}, running: {len(optimizations.running)}, queued: {len(optimizations.queued or [])}")
        if len(optimizations.running) == 0 and len(optimizations.queued or []) == 0:
            signal.set()
            break
        await asyncio.sleep(0.5)
    return time.perf_counter() - start
```

The same information is available without the client, with a `GET` request to `/collections/{collection_name}/optimizations`, or to `/collections/{collection_name}` and reading `.update_queue.deferred_points`. It also feeds [telemetry and metrics](/documentation/ops-monitoring/monitoring/), so the same numbers can back a dashboard or an alert.

## Send Search Queries During Optimization

While optimization runs, repeatedly query both collections with 1,000 sampled vectors and record each query's latency, until the optimization signal fires.

```python
queries = data.sample(1000)["emb"].to_list()

async def query(signal: asyncio.Event, collection_name: str, queries: list) -> tuple[list[float], float]:
    start = time.perf_counter()
    latencies = []
    while True:
        for q in queries:
            q_start = time.perf_counter()
            await client.query_points(collection_name=collection_name, query=q)
            latencies.append(time.perf_counter() - q_start)
        if signal.is_set():
            break
    return latencies, time.perf_counter() - start
```

Run the upload against both collections, then run the query loop and the optimization monitor concurrently against each, so query latency is measured for the full duration of optimization.

```python
async def query_and_optimize(collection_name: str, queries: list) -> dict:
    signal = asyncio.Event()
    opt_time, (latencies, query_time) = await asyncio.gather(
        get_optimizations_progress(signal, collection_name),
        query(signal, collection_name, queries),
    )
    return {"total_optimization_time": opt_time, "total_query_time": query_time, "query_latencies": latencies}

await asyncio.gather(upload_points("prevent-unoptimized", data), upload_points("allow-unoptimized", data))
stats_prevent, stats_unopt = await asyncio.gather(
    query_and_optimize("prevent-unoptimized", queries),
    query_and_optimize("allow-unoptimized", queries),
)
```

## Measured Result

Against a 768-dimensional, 100,000-point collection on a Qdrant Cloud Free Tier cluster, `prevent_unoptimized` cut total optimization time from 88.1 seconds to 0.6 seconds and left query throughput and latency essentially unchanged:

| Setting | Optimization Time | p50 Latency | p95 Latency | p99 Latency | Throughput |
| --- | --- | --- | --- | --- | --- |
| `prevent_unoptimized=true` | 0.56s | 0.117s | 0.187s | 0.206s | 7.16 qps |
| `prevent_unoptimized=false` | 88.15s | 0.120s | 0.193s | 0.209s | 7.00 qps |

The optimizer finishes 150 times faster because it is no longer competing with searches that are scanning large unindexed segments, and query latency does not regress in the meantime.

## Tradeoffs

The faster optimization and steady query latency might suggest `prevent_unoptimized` is always the right call. It is not the full story: by definition, `prevent_unoptimized` withholds points in segments that have not finished optimizing, from search results.

This means searches return fewer results, if any, and are limited to points that were uploaded first, which is also a freshness problem: recently written data will not show up until its segment is done optimizing.

A temporary loss of results and recall is often acceptable in smaller collections with short optimization times, where `prevent_unoptimized` is a clear latency win. In bigger collections with longer optimization times, the same setting can leave users looking at partial results for a long time, until every segment is fully optimized. Weigh that against your collection's write volume and segment size before turning it on.

On a replicated collection, `prevent_unoptimized` also makes points blink across replicas: a deferred point becomes visible on each replica at a slightly different time, so successive requests for the same query can land on different replicas and see a point appear, disappear, and reappear. Pin a client's reads to one replica with the `X-Qdrant-Route-Affinity` header to avoid this. See [Read Affinity](/documentation/scaling/consistency-guarantees/#read-affinity) for details.

## Related Reading

- Both mechanisms compared side by side: [Query Indexed Data Only](/documentation/search/low-latency-search/#query-indexed-data-only)
- Full mechanics and configuration: [Prevent Reads from Large Unindexed Segments](/documentation/ops-optimization/optimizer/#prevent-reads-from-large-unindexed-segments)
- Deferred point counts and optimizer telemetry: [Monitoring](/documentation/ops-monitoring/monitoring/)
