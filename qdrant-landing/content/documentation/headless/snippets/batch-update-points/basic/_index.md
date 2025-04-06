## Batch update

_Available as of v1.5.0_

You can batch multiple point update operations. This includes inserting,
updating and deleting points, vectors and payload.

A batch update request consists of a list of operations. These are executed in
order. These operations can be batched:

- [Upsert points](#upload-points): `upsert` or `UpsertOperation`
- [Delete points](#delete-points): `delete_points` or `DeleteOperation`
- [Update vectors](#update-vectors): `update_vectors` or `UpdateVectorsOperation`
- [Delete vectors](#delete-vectors): `delete_vectors` or `DeleteVectorsOperation`
- [Set payload](/documentation/concepts/payload/#set-payload): `set_payload` or `SetPayloadOperation`
- [Overwrite payload](/documentation/concepts/payload/#overwrite-payload): `overwrite_payload` or `OverwritePayload`
- [Delete payload](/documentation/concepts/payload/#delete-payload-keys): `delete_payload` or `DeletePayloadOperation`
- [Clear payload](/documentation/concepts/payload/#clear-payload): `clear_payload` or `ClearPayloadOperation`

The following example snippet makes use of all operations.

REST API ([Schema](https://api.qdrant.tech/master/api-reference/points/batch-update)):

