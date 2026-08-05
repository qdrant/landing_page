```rust
use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder,
    KeywordIndexParamsBuilder,
    FieldType,
    Memory
};
use qdrant_client::Qdrant;

client.create_field_index(
    CreateFieldIndexCollectionBuilder::new(
        "{collection_name}",
        "payload_field_name",
        FieldType::Keyword,
    )
    .field_index_params(
        KeywordIndexParamsBuilder::default()
            .memory(Memory::Cold),
    ),
).await?;
```
