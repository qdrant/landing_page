```rust
use std::collections::HashMap;

use qdrant_client::qdrant::{Document, Query, QueryPointsBuilder, Value};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let mut options = HashMap::new();
options.insert("language".to_string(), Value::from("none"));
options.insert("tokenizer".to_string(), Value::from("multilingual"));
options.insert("ascii_folding".to_string(), Value::from(true));

client
    .query(
        QueryPointsBuilder::new("books")
            .query(Query::new_nearest(Document {
                text: "Mieville".into(),
                model: "qdrant/bm25".into(),
                options,
            }))
            .using("author-bm25")
            .limit(10)
            .with_payload(true)
            .build(),
    )
    .await?;
```
