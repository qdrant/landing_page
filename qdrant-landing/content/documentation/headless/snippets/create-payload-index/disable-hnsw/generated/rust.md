```rust
use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder, FieldType, KeywordIndexParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new(
            "{collection_name}",
            "name_of_the_field_to_index",
            FieldType::Keyword,
        )
        .field_index_params(KeywordIndexParamsBuilder::default().enable_hnsw(false)),
    )
    .await?;
```
