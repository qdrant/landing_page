```rust
use qdrant_client::qdrant::{
    Document, NamedVectors, PointStruct, UpsertPointsBuilder,
};
use qdrant_client::Payload;

let dense_model = "sentence-transformers/all-minilm-l6-v2";
let bm25_model = "qdrant/bm25";
// NOTE: load_dataset is a user-defined function.
// Implement it to handle dataset loading as needed.
let dataset: Vec<_> = load_dataset("miriad/miriad-4.4M", "train[0:100]");

let points: Vec<PointStruct> = dataset
    .iter()
    .map(|item| {
        let passage = item["passage_text"].as_str().unwrap();
        let vectors = NamedVectors::default()
            .add_vector(
                "dense_vector",
                Document::new(passage, dense_model),
            )
            .add_vector(
                "bm25_sparse_vector",
                Document::new(passage, bm25_model),
            );
        let payload = Payload::try_from(item.clone()).unwrap();
        PointStruct::new(Uuid::new_v4().to_string(), vectors, payload)
    })
    .collect();

client
    .upsert_points(UpsertPointsBuilder::new(collection_name, points))
    .await?;
```
