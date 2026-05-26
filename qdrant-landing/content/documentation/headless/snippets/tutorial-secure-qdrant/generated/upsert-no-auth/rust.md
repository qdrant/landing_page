```rust
let client = Qdrant::from_url("https://localhost:6334").build()?;

let result = client
    .upsert_points(UpsertPointsBuilder::new(
        "my_collection",
        vec![PointStruct::new(1, vec![0.1_f32, 0.2, 0.3, 0.4], [("source", "tutorial".into())])],
    ))
    .await;
if let Err(e) = result {
    println!("{}", e); // Unauthorized
}
```
