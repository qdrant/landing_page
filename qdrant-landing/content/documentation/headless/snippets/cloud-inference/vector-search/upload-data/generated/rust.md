```rust
use qdrant_client::qdrant::{
    Document, NamedVectors, PointStruct, UpsertPointsBuilder,
};
use qdrant_client::Payload;
use uuid::Uuid;

let dense_model = "sentence-transformers/all-minilm-l6-v2";
// NOTE: load_dataset is a user-defined function.
// Implement it to return 100 random rows with distinct passages, as the Python version does.
let dataset: Vec<_> = load_dataset("miriad/miriad-4.4M", "train");

let points: Vec<PointStruct> = dataset
    .iter()
    .map(|item| {
        let passage = item["passage_text"].as_str().unwrap();
        let vectors = NamedVectors::default().add_vector(
            "dense_vector",
            Document::new(passage, dense_model),
        );
        // The payload includes passage_text, used for BM25
        let payload = Payload::try_from(item.clone()).unwrap();
        PointStruct::new(Uuid::new_v4().to_string(), vectors, payload)
    })
    .collect();

client
    .upsert_points(UpsertPointsBuilder::new("{collection_name}", points))
    .await?;
```
