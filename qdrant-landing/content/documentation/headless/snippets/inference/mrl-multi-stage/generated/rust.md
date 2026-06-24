```rust
use std::collections::HashMap;

use qdrant_client::{
    Qdrant,
    qdrant::{Document, PrefetchQueryBuilder, Query, QueryPointsBuilder, Value},
};

client
    .with_header("openai-api-key", "<YOUR_OPENAI_API_KEY>")
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .query(Query::new_nearest(Document {
                        text: "How to bake cookies?".into(),
                        model: "openai/text-embedding-3-small".into(),
                        options: HashMap::<String, Value>::from_iter(vec![(
                            "mrl".into(),
                            Value::from(64),
                        )]),
                    }))
                    .using("small")
                    .limit(1000_u64),
            )
            .query(Query::new_nearest(Document {
                text: "How to bake cookies?".into(),
                model: "openai/text-embedding-3-small".into(),
                options: HashMap::new(),
            }))
            .using("large")
            .limit(10_u64)
            .build(),
    )
    .await?;
```
