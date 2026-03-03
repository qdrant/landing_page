```rust
let server_client = Qdrant::from_url(QDRANT_URL)
    .api_key(QDRANT_API_KEY)
    .build()?;

if !server_client.collection_exists(COLLECTION_NAME).await? {
    server_client
        .create_collection(
            CreateCollectionBuilder::new(COLLECTION_NAME).vectors_config(
                VectorParamsBuilder::new(VECTOR_DIMENSION as u64, Distance::Cosine),
            ),
        )
        .await?;
}
```
