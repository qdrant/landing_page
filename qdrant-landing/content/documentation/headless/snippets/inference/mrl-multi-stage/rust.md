```rust
use std::collections::HashMap;

use qdrant_client::{
    Qdrant, QdrantError,
    qdrant::{Document, PrefetchQueryBuilder, Query, QueryPointsBuilder, Value},
};

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .query(Query::new_nearest(Document {
                        text: "How to bake cookies?".into(),
                        model: "openai/text-embedding-3-small".into(),
                        options: HashMap::<String, Value>::from_iter(vec![
                            (
                                "openai-api-key".to_string(),
                                Value::from("<YOUR_OPENAI_API_KEY>"),
                            ),
                            ("mrl".into(), Value::from(64)),
                        ]),
                    }))
                    .using("small")
                    .limit(10_u64),
            )
            .query(Query::new_nearest(Document {
                text: "How to bake cookies?".into(),
                model: "openai/text-embedding-3-small".into(),
                options: HashMap::from_iter(vec![(
                    "openai-api-key".into(),
                    "<YOUR_OPENAI_API_KEY>".into(),
                )]),
            }))
            .using("large")
            .limit(10_u64)
            .build(),
    )
    .await?;
```
