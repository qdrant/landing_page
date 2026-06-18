```rust
use std::collections::HashMap;

use qdrant_client::{
    Payload, Qdrant,
    qdrant::{Document, NamedVectors, PointStruct, UpsertPointsBuilder, Value},
};

client
    .with_header("openai-api-key", "<YOUR_OPENAI_API_KEY>")
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
                            options: HashMap::new(),
                        },
                    )
                    .add_vector(
                        "small",
                        Document {
                            text: "Recipe for baking chocolate chip cookies".into(),
                            model: "openai/text-embedding-3-small".into(),
                            options: HashMap::<String, Value>::from_iter(vec![(
                                "mrl".into(),
                                Value::from(64),
                            )]),
                        },
                    ),
                Payload::default(),
            )],
        )
        .wait(true),
    )
    .await?;
```
