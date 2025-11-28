```rust
use qdrant_client::qdrant::{with_payload_selector::SelectorOptions, QueryPointGroupsBuilder, WithLookupBuilder};

client
    .query_groups(
        QueryPointGroupsBuilder::new("{collection_name}", "document_id")
            .query(vec![0.2, 0.1, 0.9, 0.7])
            .limit(2u64)
            .limit(2u64)
            .with_lookup(
                WithLookupBuilder::new("documents")
                    .with_payload(SelectorOptions::Include(
                        vec!["title".to_string(), "text".to_string()].into(),
                    ))
                    .with_vectors(false),
            ),
    )
    .await?;
```
