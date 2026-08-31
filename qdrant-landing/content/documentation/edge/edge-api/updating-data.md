---
title: "Updating Data"
short_description: "Write to a Qdrant Edge Shard with the update method and the full set of update operations."
description: "Reference for updating data in a Qdrant Edge Shard: the update method, every UpdateOperation constructor in Python, and the equivalent Rust enum variants."
weight: 30
---

# Updating Data

Every write to an Edge Shard goes through a single method, `update`, which takes one `UpdateOperation` describing what to change. The operation is written to the write-ahead log before it is applied to storage, so an update that has returned survives a crash.

## update

```python
def update(self, operation: UpdateOperation) -> None
```

```rust
pub fn update(&self, operation: UpdateOperation) -> OperationResult<()>
```

| Parameter | Description |
|---|---|
| `operation` | The operation to apply. |

**Returns** nothing in Python. In Rust, returns `Ok(())` on success.

Creating a named vector that already exists with different parameters fails.

## Update Operations

In Python, `UpdateOperation` is a class with static constructors, one per operation. Each returns an `UpdateOperation` to pass to `update`.

| Operation | Parameters | Description |
|---|---|---|
| `upsert_points` | `points`, `condition`, `update_mode` | Insert or update points. |
| `delete_points` | `point_ids` | Delete points by ID. |
| `delete_points_by_filter` | `filter` | Delete every point matching a filter. |
| `update_vectors` | `point_vectors`, `condition` | Replace vectors on existing points. |
| `delete_vectors` | `point_ids`, `vector_names` | Delete named vectors from points. |
| `delete_vectors_by_filter` | `filter`, `vector_names` | Delete named vectors from matching points. |
| `set_payload` | `point_ids`, `payload`, `key` | Merge payload fields into points. |
| `set_payload_by_filter` | `filter`, `payload`, `key` | Merge payload fields into matching points. |
| `overwrite_payload` | `point_ids`, `payload`, `key` | Replace the entire payload on points. |
| `overwrite_payload_by_filter` | `filter`, `payload`, `key` | Replace the entire payload on matching points. |
| `delete_payload` | `point_ids`, `keys` | Delete named payload fields from points. |
| `delete_payload_by_filter` | `filter`, `keys` | Delete named payload fields from matching points. |
| `clear_payload` | `point_ids` | Delete all payload from points. |
| `clear_payload_by_filter` | `filter` | Delete all payload from matching points. |
| `create_field_index` | `field_name`, `schema` | Index a payload field. |
### Payload Indexes

The `update` operation also enables you to create and delete payload indexes.

| Operation | Parameters | Description |
|---|---|---|
| `create_field_index` | `field_name`, `schema` | Index a payload field. |
| `delete_field_index` | `field_name` | Remove a payload field index. |

### Modify the Vector Schema

Add or remove named vectors to an existing Edge Shard’s schema. This is useful when migrating to a new embedding model or adding hybrid search to an Edge Shard that already contains data.

| Operation | Parameters | Description |
|---|---|---|
| `create_dense_vector` | `vector_name`, `size`, `distance`, `multivector_config`, `datatype` | Add a dense named vector to the schema. |
| `create_sparse_vector` | `vector_name`, `modifier`, `datatype` | Add a sparse named vector to the schema. |
| `delete_vector_name` | `vector_name` | Remove a named vector from the schema. |

### Parameters

The `key` parameter on the payload operations targets a nested field path rather than the payload root.

The `condition` parameter gates the write by a filter, but the two operations differ. On `update_vectors` it applies to the whole operation: only points matching the filter are updated. On `upsert_points` it applies only to points that already exist, so an existing point that fails the filter is left untouched while a point that is new to the shard is inserted regardless of the filter.

The `condition` parameter controls whether a write is applied, but its behavior depends on the operation.
For `update_vectors`, only points that match the filter are updated. For `upsert_points`, the filter applies only to existing points. Existing points that do not match the filter remain unchanged, while new points are inserted regardless of the filter.

`upsert_points` also takes an `update_mode`:

| Mode | Behavior |
|---|---|
| `UpdateMode.Upsert` | Insert new points and update existing ones. This is the default behavior. |
| `UpdateMode.InsertOnly` | Insert new points, leave existing ones untouched. |
| `UpdateMode.UpdateOnly` | Update existing points, do not insert new ones. |

In Rust, `UpdateOperation` is an enum that groups operations by what they modify:

| Variant | Covers |
|---|---|
| `PointOperation` | Upserting, deleting, and syncing points. |
| `VectorOperation` | Updating and deleting named vectors on existing points. |
| `PayloadOperation` | Setting, overwriting, deleting, and clearing payload. |
| `FieldIndexOperation` | Creating and deleting payload field indexes. |
| `VectorNameOperation` | Adding and removing named vectors from the schema. |

<aside role="status">Adding a named vector does not populate it on existing points. Re-upsert those points to give them a value for the new vector. Refer to <a href="/documentation/edge/edge-quickstart/#modify-the-vector-schema">Modify the Vector Schema</a>.</aside>
