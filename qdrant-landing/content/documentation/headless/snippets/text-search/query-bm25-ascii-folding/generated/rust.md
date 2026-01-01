```rust
use std::collections::HashMap;

use qdrant_client::qdrant::{DocumentBuilder, Query, QueryPointsBuilder, Value};
use qdrant_client::Qdrant;

let mut options = HashMap::new();
options.insert("ascii_folding".to_string(), Value::from(true));

client
    .query(
        QueryPointsBuilder::new("books")
            .query(Query::new_nearest(
                DocumentBuilder::new("Mieville", "qdrant/bm25")
                    .options(options)
                    .build(),
            ))
            .using("author-bm25")
            .limit(10)
            .with_payload(true)
            .build(),
    )
    .await?;
```
