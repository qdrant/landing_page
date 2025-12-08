```rust
use std::collections::HashMap;

use qdrant_client::{
    Payload, Qdrant, QdrantError,
    qdrant::{Document, NamedVectors, PointStruct, UpsertPointsBuilder, Value},
};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .upsert_points(
        UpsertPointsBuilder::new(
            "{collection_name}",
            vec![PointStruct::new(
                1,
                NamedVectors::default()
                    .add_vector(
                        "large",
                        Document {
                            text: "Recipe for baking chocolate chip cookies".into(),
                            model: "openai/text-embedding-3-small".into(),
                            options: HashMap::<String, Value>::from_iter(vec![(
                                "openai-api-key".into(),
                                "<YOUR_OPENAI_API_KEY>".into(),
                            )]),
                        },
                    )
                    .add_vector(
                        "small",
                        Document {
                            text: "Recipe for baking chocolate chip cookies".into(),
                            model: "openai/text-embedding-3-small".into(),
                            options: HashMap::<String, Value>::from_iter(vec![
                                (
                                    "openai-api-key".into(),
                                    Value::from("<YOUR_OPENAI_API_KEY>"),
                                ),
                                ("mrl".into(), Value::from(64)),
                            ]),
                        },
                    ),
                Payload::default(),
            )],
        )
        .wait(true),
    )
    .await?;
```
