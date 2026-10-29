---
title: "Reading Data"
short_description: "Read from a Qdrant Edge Shard with query, query_batch, scroll, retrieve, count, and facet."
description: "Reference for reading data from a Qdrant Edge Shard: similarity search with query and query_batch, paging with scroll, grouping, retrieving points by ID, counting, and faceting payload fields."
weight: 40
---

# Reading Data

An Edge Shard offers several ways to read data. `query` is the similarity search entry point, supporting prefetches, fusion, and reranking, and `query_batch` runs several queries as one batch. `scroll` pages through points without scoring them, and `retrieve`, `count`, and `facet` read points and payload statistics directly.

<aside role="status">In Rust, <code>query_groups</code> and <code>search_matrix</code> require the <code>EdgeShardRead</code> trait in scope: <code>use qdrant_edge::EdgeShardRead;</code></aside>

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
| --- | --- | --- |
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
| --- | --- |
| `Query` | Vector similarity: nearest neighbor, recommendation, discovery, context, or feedback. |
| `TextQuery` | BM25 ranking over a full-text index on a payload field. Refer to [BM25 with Qdrant Edge](/documentation/edge/edge-bm25/). |
| `Fusion` | Combine the results of multiple prefetches. Refer to [Hybrid Queries](/documentation/search/hybrid-queries/). |
| `OrderBy` | Order by a payload field instead of by similarity. |
| `Formula` | Rescore prefetch results with an expression over payload and score. |
| `Mmr` | Maximal marginal relevance, trading similarity against diversity. |
| `TextQuery` | BM25 over the full-text index of a payload field. The field's index must be created with `scoring` enabled. Refer to [BM25 with Qdrant Edge](/documentation/edge/edge-bm25/). |
| `Sample` | Return a sample of points. |

`Prefetch` takes `query`, `limit`, `filter`, `score_threshold`, `params`, and its own nested `prefetches`, so prefetches can be nested to build multi-stage retrieval.

## query_batch

Runs several queries in one batch. This is cheaper than calling `query` for each request: Qdrant plans the queries together so they share a single pass over the segments. Queries that differ only in their vector are also scored together.

```python
def query_batch(self, request: QueryBatchRequest) -> List[List[ScoredPoint]]
```

```rust
pub fn query_batch(&self, request: QueryBatchRequest) -> OperationResult<Vec<Vec<ScoredPoint>>>
```

`QueryBatchRequest` accepts the following parameters. In Rust, create one with `QueryBatchRequest::new(queries)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `queries` | list of `QueryRequest` | The queries to run together. Each accepts the parameters described in [`query`](#query). |

**Returns** one list of `ScoredPoint` per query, in the same order as `queries`.

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
| --- | --- | --- |
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
| --- | --- | --- |
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
| --- | --- | --- |
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
| --- | --- |
| `point_ids` | IDs to fetch. |
| `with_payload` | Which payload to include. |
| `with_vector` | Which vectors to include. |

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
| --- | --- | --- |
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
| --- | --- | --- |
| `key` | `JsonPath` | Payload field to facet on. Required. |
| `limit` | `int` | Maximum number of distinct values to return. |
| `exact` | `bool` | Compute exact counts rather than estimating. |
| `filter` | `Filter` | Restrict faceting to matching points. |

<aside role="status">Faceting and filtering both benefit from a payload index on the field. Refer to <a href="/documentation/edge/edge-quickstart/#create-a-payload-index">Create a Payload Index</a>.</aside>

## Request Builders

In Rust, the request types follow the fluent builder pattern:

```rust
let request = QueryRequestBuilder::new(10)
    .with_payload(WithPayloadInterface::Bool(true))
    .build();
```

Builders are available for `QueryRequest`, `ScrollRequest`, `RetrieveRequest`, `CountRequest`, `FacetRequest`, `GroupRequest`, `SearchMatrixRequest`, and `Prefetch`.

In Python, requests are created through their class constructors.
