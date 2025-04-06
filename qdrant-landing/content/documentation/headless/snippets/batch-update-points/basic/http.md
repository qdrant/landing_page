```http
POST /collections/{collection_name}/points/batch
{
    "operations": [
        {
            "upsert": {
                "points": [
                    {
                        "id": 1,
                        "vector": [1.0, 2.0, 3.0, 4.0],
                        "payload": {}
                    }
                ]
            }
        },
        {
            "update_vectors": {
                "points": [
                    {
                        "id": 1,
                        "vector": [1.0, 2.0, 3.0, 4.0]
                    }
                ]
            }
        },
        {
            "delete_vectors": {
                "points": [1],
                "vector": [""]
            }
        },
        {
            "overwrite_payload": {
                "payload": {
                    "test_payload": "1"
                },
                "points": [1]
            }
        },
        {
            "set_payload": {
                "payload": {
                    "test_payload_2": "2",
                    "test_payload_3": "3"
                },
                "points": [1]
            }
        },
        {
            "delete_payload": {
                "keys": ["test_payload_2"],
                "points": [1]
            }
        },
        {
            "clear_payload": {
                "points": [1]
            }
        },
        {"delete": {"points": [1]}}
    ]
}
```
