```rust
use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder, FieldType, FloatIndexParamsBuilder,
    KeywordIndexParamsBuilder,
};
use qdrant_client::Qdrant;

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new(
            "{collection_name}",
            "offers[].shop",
            FieldType::Keyword,
        )
        .field_index_params(KeywordIndexParamsBuilder::default().nested("offers")),
    )
    .await?;

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new(
            "{collection_name}",
            "offers[].price",
            FieldType::Float,
        )
        .field_index_params(FloatIndexParamsBuilder::default().nested("offers")),
    )
    .await?;
```
