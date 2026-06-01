```rust
let client = Qdrant::from_url("https://localhost:6334")
    .api_key("my-read-only-key")
    .build()?;

let result = client
    .delete_points(
        DeletePointsBuilder::new("my_collection").points(PointsIdsList {
            ids: vec![1.into()],
        }),
    )
    .await;
if let Err(e) = result {
    println!("{}", e); // PermissionDenied
}
```
