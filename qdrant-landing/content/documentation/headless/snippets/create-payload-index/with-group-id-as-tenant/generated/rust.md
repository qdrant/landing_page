```rust
use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder,
    KeywordIndexParamsBuilder,
    FieldType
};
use qdrant_client::Qdrant;

client.create_field_index(
        CreateFieldIndexCollectionBuilder::new(
            "{collection_name}",
            "group_id",
            FieldType::Keyword,
        ).field_index_params(
            KeywordIndexParamsBuilder::default()
                .is_tenant(true)
        )
    ).await?;
```
