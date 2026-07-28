```rust
const MAIN: &str = "docs-sync-scale";
const MODEL: &str = "sentence-transformers/all-MiniLM-L6-v2";

if !client.collection_exists(MAIN).await? {
    let mut metadata: HashMap<String, Value> = HashMap::new();
    metadata.insert("embedding_model".to_string(), json!(MODEL));
    metadata.insert("pipeline_version".to_string(), json!("1"));

    client
        .create_collection(
            CreateCollectionBuilder::new(MAIN)
                .vectors_config(VectorParamsBuilder::new(384, Distance::Cosine))
                .metadata(metadata),
        )
        .await?;
    client
        .create_field_index(CreateFieldIndexCollectionBuilder::new(
            MAIN,
            "sync_bucket",
            FieldType::Integer,
        ))
        .await?;
}
```
