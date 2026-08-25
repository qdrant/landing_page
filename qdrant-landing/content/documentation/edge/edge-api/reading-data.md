---
title: "Reading Data"
short_description: "Read from a Qdrant Edge Shard with query, scroll, retrieve, count, and facet."
description: "Reference for reading data from a Qdrant Edge Shard: similarity search with query, paging with scroll, grouping, retrieving points by ID, counting, and faceting payload fields."
weight: 40
---

# Reading Data

An Edge Shard offers several ways to read data. `query` is the similarity search entry point, supporting prefetches, fusion, and reranking. `scroll` pages through points without scoring them, and `retrieve`, `count`, and `facet` read points and payload statistics directly.

<aside role="status">In Rust, <code>query_groups</code> and <code>search_matrix</code> are provided only by the <code>EdgeShardRead</code> trait, so bring it into scope with <code>use qdrant_edge::EdgeShardRead;</code> to call them. The other read methods are also inherent methods on <code>EdgeShard</code> and need no import.</aside>

## query

Runs a query, optionally combining the results of nested prefetch queries.

```python
def query(self, query: QueryRequest) -> List[ScoredPoint]
```

```rust
pub fn query(&self, request: QueryRequest) -> OperationResult<Vec<ScoredPoint>>
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

## scroll

Pages through points in the shard without scoring them.

```python
def scroll(self, scroll: ScrollRequest) -> Tuple[List[Record], Optional[PointId]]
```

```rust
pub fn scroll(&self, request: ScrollRequest) -> OperationResult<(Vec<Record>, Option<PointId>)>
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

*Rust only*

Groups query results by a payload field, returning a bounded number of hits per distinct value.

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

*Rust only*

Samples points and finds each sample's nearest neighbors, producing a similarity matrix useful for clustering and visualization.

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
pub fn retrieve(&self, request: RetrieveRequest) -> OperationResult<Vec<Record>>
```

**Returns** a list of `Record`. Points that do not exist are omitted rather than reported as errors.

| Parameter | Description |
|---|---|
| `point_ids` | IDs to fetch. |
| `with_payload` | Which payload to include. |
| `with_vector` | Which vectors to include. |

Python takes these as three arguments, while Rust collects them into a `RetrieveRequest`.

## count

Counts the points matching a filter.

```python
def count(self, count: CountRequest) -> int
```

```rust
pub fn count(&self, request: CountRequest) -> OperationResult<usize>
```

**Returns** the number of matching points.

| Parameter | Type | Description |
|---|---|---|
| `filter` | `Filter` | Conditions the counted points must satisfy. Omit to count every point. |
| `exact` | `bool` | Count exactly rather than estimating. |

## facet

Returns the most common values of a payload field, with a count for each.

```python
def facet(self, facet: FacetRequest) -> FacetResponse
```

```rust
pub fn facet(&self, request: FacetRequest) -> OperationResult<FacetResponse>
```

**Returns** a `FacetResponse` whose `hits` each carry a `value` and its `count`.

| Parameter | Type | Description |
|---|---|---|
| `key` | `JsonPath` | Payload field to facet on. Required. |
| `limit` | `int` | Maximum number of distinct values to return. |
| `exact` | `bool` | Compute exact counts rather than estimating. |
| `filter` | `Filter` | Restrict faceting to matching points. |

<aside role="status">Faceting and filtering both benefit from a payload index on the field. Refer to <a href="/documentation/edge/edge-quickstart/#create-a-payload-index">Create a Payload Index</a>.</aside>

## Request Builders

Rust request types use builders. Create the builder directly with `Builder::new()` rather than calling `builder()` on the request type:

```rust
let request = QueryRequestBuilder::new(10)
    .with_payload(WithPayloadInterface::Bool(true))
    .build();
```

Pass required parameters to `new()` and configure optional parameters with setters:

| Builder | Constructor |
|---|---|
| `QueryRequestBuilder` | `new(limit)` |
| `PrefetchBuilder` | `new(limit)` |
| `ScrollRequestBuilder` | `new()` |
| `RetrieveRequestBuilder` | `new(point_ids)` |
| `CountRequestBuilder` | `new()` |
| `FacetRequestBuilder` | `new(key)` |
| `GroupRequestBuilder` | `new(query, group_by, groups, group_size)` |
| `SearchMatrixRequestBuilder` | `new(sample_size, limit_per_sample, using)` |

Configuration types work differently. `EdgeConfig`, `EdgeVectorParams`, and `EdgeSparseVectorParams` expose a `builder()` method. Refer to [Configuration](/documentation/edge/edge-api/configuration/).

Python does not use request builders. Requests are created directly through class constructors.
