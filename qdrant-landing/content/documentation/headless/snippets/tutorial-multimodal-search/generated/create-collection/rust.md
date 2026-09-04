```rust
let collection_name = "multimodal-embeddings";

if !client.collection_exists(collection_name).await? {
    let mut vectors = VectorsConfigBuilder::default();
    vectors.add_named_vector_params("image", VectorParamsBuilder::new(512, Distance::Cosine));
    vectors.add_named_vector_params("text", VectorParamsBuilder::new(512, Distance::Cosine));

    client
        .create_collection(CreateCollectionBuilder::new(collection_name).vectors_config(vectors))
        .await?;
}
```
