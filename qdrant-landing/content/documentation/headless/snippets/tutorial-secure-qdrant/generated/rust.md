```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, DeletePointsBuilder, Distance, PointStruct, PointsIdsList,
    UpsertPointsBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("https://localhost:6334").build()?;

let result = client
    .create_collection(
        CreateCollectionBuilder::new("my_collection")
            .vectors_config(VectorParamsBuilder::new(4, Distance::Cosine)),
    )
    .await;
if let Err(e) = result {
    println!("{}", e); // Unauthorized
}

let result = client
    .upsert_points(UpsertPointsBuilder::new(
        "my_collection",
        vec![PointStruct::new(1, vec![0.1_f32, 0.2, 0.3, 0.4], [("source", "tutorial".into())])],
    ))
    .await;
if let Err(e) = result {
    println!("{}", e); // Unauthorized
}

let client = Qdrant::from_url("https://localhost:6334")
    .api_key("my-admin-key")
    .build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("my_collection")
            .vectors_config(VectorParamsBuilder::new(4, Distance::Cosine)),
    )
    .await?;

client
    .upsert_points(UpsertPointsBuilder::new(
        "my_collection",
        vec![PointStruct::new(1, vec![0.1_f32, 0.2, 0.3, 0.4], [("source", "tutorial".into())])],
    ))
    .await?;

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

let client = Qdrant::from_url("https://localhost:6334")
    .api_key("<your-jwt>")
    .build()?;

client
    .upsert_points(UpsertPointsBuilder::new(
        "my_collection",
        vec![PointStruct::new(2, vec![0.5_f32, 0.6, 0.7, 0.8], [("source", "tutorial".into())])],
    ))
    .await?;

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
