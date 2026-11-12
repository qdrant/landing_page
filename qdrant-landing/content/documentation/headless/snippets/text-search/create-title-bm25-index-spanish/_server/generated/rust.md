```rust
use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder, FieldType, TextIndexParamsBuilder, TokenizerType,
};
use qdrant_client::Qdrant;

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new("books", "title", FieldType::Text)
            .field_index_params(
                TextIndexParamsBuilder::new(TokenizerType::Word)
                    .snowball_stemmer("spanish".to_string())
                    .stopwords_language("spanish".to_string())
                    .bm25_scoring()
                    .build(),
            ),
    )
    .await?;
```
