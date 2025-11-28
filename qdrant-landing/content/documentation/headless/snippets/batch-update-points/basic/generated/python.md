```python
client.batch_update_points(
    collection_name="{collection_name}",
    update_operations=[
        models.UpsertOperation(
            upsert=models.PointsList(
                points=[
                    models.PointStruct(
                        id=1,
                        vector=[1.0, 2.0, 3.0, 4.0],
                        payload={},
                    ),
                ]
            )
        ),
        models.UpdateVectorsOperation(
            update_vectors=models.UpdateVectors(
                points=[
                    models.PointVectors(
                        id=1,
                        vector=[1.0, 2.0, 3.0, 4.0],
                    )
                ]
            )
        ),
        models.DeleteVectorsOperation(
            delete_vectors=models.DeleteVectors(points=[1], vector=[""])
        ),
        models.OverwritePayloadOperation(
            overwrite_payload=models.SetPayload(
                payload={"test_payload": 1},
                points=[1],
            )
        ),
        models.SetPayloadOperation(
            set_payload=models.SetPayload(
                payload={
                    "test_payload_2": 2,
                    "test_payload_3": 3,
                },
                points=[1],
            )
        ),
        models.DeletePayloadOperation(
            delete_payload=models.DeletePayload(keys=["test_payload_2"], points=[1])
        ),
        models.ClearPayloadOperation(clear_payload=models.PointIdsList(points=[1])),
        models.DeleteOperation(delete=models.PointIdsList(points=[1])),
    ],
)
```
