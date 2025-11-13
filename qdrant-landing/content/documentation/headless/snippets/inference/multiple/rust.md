```rust
use qdrant_client::{
    Payload, Qdrant, QdrantError,
    qdrant::{Document, PointStruct, UpsertPointsBuilder, Vectors},
};
use std::collections::HashMap;

let client = Qdrant::from_url("http://localhost:6333").build()?;

let mut jina_options = HashMap::new();
jina_options.insert("jina-api-key".to_string(), "<YOUR_JINAAI_API_KEY>".into());
jina_options.insert("dimensions".to_string(), 512.into());

client
    .upsert_points(
        UpsertPointsBuilder::new(
            "<your-collection>",
            vec![PointStruct::new(
                1,
                NamedVectors::default()
                    .add_vector(
                        "image",
                        Image {
                            image: Some("https://qdrant.tech/example.png".into()),
                            model: "jinaai/jina-clip-v2".into(),
                            options: jina_options,
                        },
                    )
                    .add_vector(
                        "text",
                        Document {
                            text: "Mars, the red planet".into(),
                            model: "sentence-transformers/all-minilm-l6-v2".into(),
                            options: HashMap::new(),
                        },
                    )
                    .add_vector(
                        "bm25",
                        Document {
                            text: "How to bake cookies?".into(),
                            model: "qdrant/bm25".into(),
                            options: HashMap::new(),
                        },
                    ),
                Payload::default(),
            )],
        )
        .wait(true),
    )
    .await?;
```
