```rust
const MODEL: &str = "sentence-transformers/all-MiniLM-L6-v2";
const PIPELINE: &str = "docs-prep-pipeline-v1";
const COLLECTION: &str = "docs-sync-tutorial";

let mut metadata: HashMap<String, Value> = HashMap::new();
metadata.insert("embedding_model".to_string(), json!(MODEL));
metadata.insert("pipeline_version".to_string(), json!(PIPELINE));

client
    .create_collection(
        CreateCollectionBuilder::new(COLLECTION)
            .vectors_config(VectorParamsBuilder::new(
                384, // all-MiniLM-L6-v2 output dimension
                Distance::Cosine,
            ))
            .metadata(metadata),
    )
    .await?;
```
