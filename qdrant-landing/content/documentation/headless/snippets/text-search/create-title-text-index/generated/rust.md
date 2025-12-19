```rust
use qdrant_client::qdrant::{CreateFieldIndexCollectionBuilder, FieldType, TextIndexParamsBuilder, TokenizerType};
use qdrant_client::Qdrant;

let params = TextIndexParamsBuilder::new(TokenizerType::Word)
    .ascii_folding(true)
    .lowercase(true)
    .build();

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new("books", "title", FieldType::Text)
            .field_index_params(params),
    )
    .await?;
```
