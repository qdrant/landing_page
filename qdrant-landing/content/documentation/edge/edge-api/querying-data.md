---
title: "Querying Data"
short_description: "Query a Qdrant Edge Shard with query, search, and scroll, including prefetches, fusion, and grouping."
description: "Reference for querying a Qdrant Edge Shard: the query, search, scroll, query_groups, and search_matrix methods, their request parameters, and the Rust request builders."
weight: 40
---

# Querying Data

Qdrant Edge offers two entry points for similarity search. `query` is the general one, supporting prefetches, fusion, and reranking. `search` is a narrower path for a single scoring query. `scroll` pages through points without scoring them.

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

## Request Builders

In Rust, each request type has a fluent builder, so you only set the parameters you need:

```rust
let request = QueryRequest::builder()
    .limit(10)
    .with_payload(true)
    .build();
```

Builders are available for `QueryRequest`, `SearchRequest`, `ScrollRequest`, `RetrieveRequest`, `CountRequest`, `FacetRequest`, `GroupRequest`, `SearchMatrixRequest`, and `Prefetch`. The Python bindings construct requests through their class constructors instead, where every optional parameter defaults to `None`.
