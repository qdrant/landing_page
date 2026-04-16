```rust
let collection_name = "my_collection";

if client.collection_exists(collection_name).await? {
    client.delete_collection(collection_name).await?;
}

let mut vectors_config = VectorsConfigBuilder::default();
vectors_config.add_named_vector_params(
    "dense_vector",
    VectorParamsBuilder::new(384, Distance::Cosine),
);

client
    .create_collection(
        CreateCollectionBuilder::new(collection_name)
            .vectors_config(vectors_config)
            .sharding_method(ShardingMethod::Custom.into()),
    )
    .await?;
```
