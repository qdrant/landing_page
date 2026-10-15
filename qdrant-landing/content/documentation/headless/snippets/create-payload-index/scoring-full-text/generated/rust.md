```rust
use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder,
    TextIndexParamsBuilder,
    FieldType,
    TokenizerType,
};
use qdrant_client::Qdrant;

let text_index_params = TextIndexParamsBuilder::new(TokenizerType::Word)
    .lowercase(true)
    .bm25_scoring();

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new(
            "{collection_name}",
            "name_of_the_field_to_index",
            FieldType::Text,
        ).field_index_params(text_index_params.build()),
    )
    .await?;
```
