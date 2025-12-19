```rust
use qdrant_client::qdrant::{CreateFieldIndexCollectionBuilder, FieldType, TextIndexParamsBuilder, TokenizerType};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let params = TextIndexParamsBuilder::new(TokenizerType::Word)
    .ascii_folding(true)
    .phrase_matching(true)
    .lowercase(true)
    .build();

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new("books", "title", FieldType::Text)
            .field_index_params(params),
    )
    .await?;
```
