```rust
// Use the HTTP API to submit both alias operations in one atomic request.
// The REST endpoint uses port 6333, unlike the gRPC client's port 6334.
let qdrant_rest_url = "https://your-cluster.cloud.qdrant.io:6333";
ureq::post(format!("{qdrant_rest_url}/collections/aliases"))
    .header("api-key", QDRANT_API_KEY)
    .send_json(serde_json::json!({
        "actions": [
            {"delete_alias": {"alias_name": "prod"}},
            {"create_alias": {
                "alias_name": "prod",
                "collection_name": new_collection
            }}
        ]
    }))?;
```
