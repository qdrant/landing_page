```rust
use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder,
    KeywordIndexParamsBuilder,
    KeywordPrefixParams,
    FieldType
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.create_field_index(
    CreateFieldIndexCollectionBuilder::new(
        "{collection_name}",
        "url",
        FieldType::Keyword,
    )
    .field_index_params(
        KeywordIndexParamsBuilder::default()
            .prefix(KeywordPrefixParams::default()),
    ),
).await?;
```
