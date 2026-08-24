---
title: "Reading Data"
short_description: "Read from a Qdrant Edge Shard with query, search, scroll, retrieve, count, facet, and info."
description: "Reference for reading data from a Qdrant Edge Shard: similarity search with query and search, paging with scroll, grouping, retrieving points by ID, counting, faceting, and inspecting shard metadata."
weight: 40
---

# Reading Data

An Edge Shard offers several ways to read data. `query` is the general similarity search entry point, supporting prefetches, fusion, and reranking, while `search` is a narrower path for a single scoring query. `scroll` pages through points without scoring them, and `retrieve`, `count`, `facet`, and `info` read points and shard metadata directly.

<aside role="status">In Rust, the read methods are provided by the <code>EdgeShardRead</code> trait rather than declared on <code>EdgeShard</code> directly. Bring it into scope with <code>use qdrant_edge::EdgeShardRead;</code> before calling them.</aside>

## query

Runs a query, optionally combining the results of nested prefetch queries.

```python
def query(self, query: QueryRequest) -> List[ScoredPoint]
```

```rust
fn query(&self, request: QueryRequest) -> OperationResult<Vec<ScoredPoint>>
```

**Returns** a list of `ScoredPoint`, ordered by score.

`QueryRequest` accepts the following parameters:

| Parameter | Type | Description |
|---|---|---|
| `limit` | `int` | Maximum number of points to return. Required. |
| `offset` | `int` | Number of results to skip. |
| `query` | scoring query | What to score by. Omit to return points without scoring, honoring the filter alone. |
| `prefetches` | list of `Prefetch` | Nested queries whose results this query reranks or fuses. |
| `filter` | `Filter` | Payload and ID conditions the points must satisfy. Refer to [Filtering](/documentation/search/filtering/). |
| `score_threshold` | `float` | Drop results scoring worse than this value. |
| `params` | `SearchParams` | Search-time tuning, such as `hnsw_ef` and `exact`. |
| `with_payload` | `bool`, list of `str`, or `PayloadSelector` | Which payload to include. |
| `with_vector` | `bool` or list of `str` | Which vectors to include. |

The `query` parameter accepts several kinds of scoring:

| Kind | Purpose |
|---|---|
| `Query` | Vector similarity: nearest neighbor, recommendation, discovery, context, or feedback. |
| `Fusion` | Combine the results of multiple prefetches. Refer to [Hybrid Queries](/documentation/search/hybrid-queries/). |
| `OrderBy` | Order by a payload field instead of by similarity. |
| `Formula` | Rescore prefetch results with an expression over payload and score. |
| `Mmr` | Maximal marginal relevance, trading similarity against diversity. |
| `Sample` | Return a sample of points. |

`Prefetch` takes `query`, `limit`, `filter`, `score_threshold`, `params`, and its own nested `prefetches`, so prefetches can be nested to build multi-stage retrieval.

## search

Runs a single scoring query. `search` has no prefetches and no fusion; use `query` when you need either.

```python
def search(self, search: SearchRequest) -> List[ScoredPoint]
```

```rust
fn search(&self, request: SearchRequest) -> OperationResult<Vec<ScoredPoint>>
```

**Returns** a list of `ScoredPoint`, ordered by score.

`SearchRequest` accepts `query` and `limit`, which are required, plus `offset`, `filter`, `params`, `with_payload`, `with_vector`, and `score_threshold`, all of which behave as they do on `QueryRequest`.

## scroll

Pages through points in the shard without scoring them.

```python
def scroll(self, scroll: ScrollRequest) -> Tuple[List[Record], Optional[PointId]]
```

```rust
fn scroll(&self, request: ScrollRequest) -> OperationResult<(Vec<Record>, Option<PointId>)>
```

**Returns** the matching records and the offset to pass to the next call, or `None` when the last page has been reached.

| Parameter | Type | Description |
|---|---|---|
| `offset` | `PointId` | Start from this point ID. Pass the offset returned by the previous call. |
| `limit` | `int` | Maximum number of points to return. |
| `filter` | `Filter` | Payload and ID conditions the points must satisfy. |
| `with_payload` | `bool`, list of `str`, or `PayloadSelector` | Which payload to include. |
| `with_vector` | `bool` or list of `str` | Which vectors to include. |
| `order_by` | `OrderBy` | Page in the order of a payload field instead of by point ID. |

## query_groups

Groups query results by a payload field, returning a bounded number of hits per distinct value. Rust only.

```rust
fn query_groups(&self, request: GroupRequest) -> OperationResult<Vec<Group>>
```

**Returns** a list of `Group`, each carrying the group's `key` and its `hits`.

| Parameter | Type | Description |
|---|---|---|
| `query` | `QueryRequest` | The query to run within each group. |
| `group_by` | `JsonPath` | Payload field to group by. |
| `groups` | `usize` | Maximum number of groups to return. |
| `group_size` | `usize` | Maximum number of hits per group. |

## search_matrix

Samples points and finds each sample's nearest neighbors, producing a similarity matrix useful for clustering and visualization. Rust only.

```rust
fn search_matrix(&self, request: SearchMatrixRequest) -> OperationResult<SearchMatrixResponse>
```

**Returns** a `SearchMatrixResponse` with `sample_ids` and, for each sample, its `nearests`.

| Parameter | Type | Description |
|---|---|---|
| `sample_size` | `usize` | Number of points to sample. |
| `limit_per_sample` | `usize` | Number of nearest neighbors to find per sampled point. |
| `filter` | `Filter` | Restrict sampling to matching points. |
| `using` | `VectorNameBuf` | Named vector to compare on. |

## retrieve

Fetches points by ID, without scoring.

```python
def retrieve(
    self,
    point_ids: List[PointId],
    with_payload: Optional[WithPayloadType] = None,
    with_vector: Optional[WithVectorType] = None,
) -> List[Record]
```

```rust
fn retrieve(&self, request: RetrieveRequest) -> OperationResult<Vec<Record>>
```

**Returns** a list of `Record`. Points that do not exist are omitted rather than reported as errors.

| Parameter | Type | Description |
|---|---|---|
| `point_ids` | list of `PointId` | IDs to fetch. |
| `with_payload` | `bool`, list of `str`, or `PayloadSelector` | Which payload to include. |
| `with_vector` | `bool` or list of `str` | Which vectors to include. |

Python takes these as three arguments, while Rust collects them into a `RetrieveRequest`.

## count

Counts the points matching a filter.

```python
def count(self, count: CountRequest) -> int
```

```rust
fn count(&self, request: CountRequest) -> OperationResult<usize>
```

**Returns** the number of matching points.

| Parameter | Type | Description |
|---|---|---|
| `filter` | `Filter` | Conditions the counted points must satisfy. Omit to count every point. |
| `exact` | `bool` | Count exactly rather than estimating. Defaults to `True` in Python. |

## facet

Returns the most common values of a payload field, with a count for each.

```python
def facet(self, facet: FacetRequest) -> FacetResponse
```

```rust
fn facet(&self, request: FacetRequest) -> OperationResult<FacetResponse>
```

**Returns** a `FacetResponse` whose `hits` each carry a `value` and its `count`.

| Parameter | Type | Description |
|---|---|---|
| `key` | `JsonPath` | Payload field to facet on. Required. |
| `limit` | `int` | Maximum number of distinct values to return. Default: `10`. |
| `exact` | `bool` | Compute exact counts rather than estimating. Default: `False`. |
| `filter` | `Filter` | Restrict faceting to matching points. |

<aside role="status">Faceting and filtering both benefit from a payload index on the field. Refer to <a href="/documentation/edge/edge-quickstart/#create-a-payload-index">Create a Payload Index</a>.</aside>

## info

Returns metadata about the shard's contents.

```python
def info(self) -> ShardInfo
```

```rust
fn info(&self) -> OperationResult<ShardInfo>
```

`ShardInfo` carries the following fields:

| Field | Type | Description |
|---|---|---|
| `segments_count` | `int` | Number of segments in the shard. |
| `points_count` | `int` | Number of points stored. |
| `indexed_vectors_count` | `int` | Number of vectors that have been added to a vector index. |
| `payload_schema` | map of field name to `PayloadIndexInfo` | The shard's payload indexes. |

An `indexed_vectors_count` well below `points_count` means segments are still waiting to be optimized. Refer to [`optimize`](/documentation/edge/edge-api/configuration/#optimize).

## Request Builders

In Rust, each request type has a fluent builder, so you only set the parameters you need:

```rust
let request = QueryRequest::builder()
    .limit(10)
    .with_payload(true)
    .build();
```

Builders are available for `QueryRequest`, `SearchRequest`, `ScrollRequest`, `RetrieveRequest`, `CountRequest`, `FacetRequest`, `GroupRequest`, `SearchMatrixRequest`, and `Prefetch`. The Python bindings construct requests through their class constructors instead, where every optional parameter defaults to `None`.
