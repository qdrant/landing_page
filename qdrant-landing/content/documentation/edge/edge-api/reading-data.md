---
title: "Reading Data"
short_description: "Read from a Qdrant Edge Shard with retrieve, count, facet, and info."
description: "Reference for reading data from a Qdrant Edge Shard: retrieving points by ID, counting points, faceting payload fields, and inspecting shard metadata."
weight: 50
---

# Reading Data

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
