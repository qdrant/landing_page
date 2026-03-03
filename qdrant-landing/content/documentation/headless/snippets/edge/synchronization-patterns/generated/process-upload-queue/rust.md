```rust
const BATCH_SIZE: usize = 10;
let points_to_upload: Vec<PointStruct> = upload_queue
    .drain(..BATCH_SIZE.min(upload_queue.len()))
    .collect();

if !points_to_upload.is_empty() {
    server_client
        .upsert_points(UpsertPointsBuilder::new(COLLECTION_NAME, points_to_upload))
        .await?;
}
```
