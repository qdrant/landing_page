```rust
let client = Qdrant::from_url("https://localhost:6334")
    .api_key("<your-jwt>")
    .build()?;

let result = client
    .upsert_points(UpsertPointsBuilder::new(
        "other_collection",
        vec![PointStruct::new(2, vec![0.5_f32, 0.6, 0.7, 0.8], [("source", "tutorial".into())])],
    ))
    .await;
if let Err(e) = result {
    println!("{}", e); // PermissionDenied
}
```
