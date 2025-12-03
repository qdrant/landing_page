```rust
use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder,
    TextIndexParamsBuilder,
    FieldType,
    TokenizerType,
    StopwordsSet,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

// Simple
let text_index_params = TextIndexParamsBuilder::new(TokenizerType::Word)
    .stopwords_language("english".to_string());

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new(
            "{collection_name}",
            "name_of_the_field_to_index",
            FieldType::Text,
        ).field_index_params(text_index_params.build()),
    )
    .await?;

// Explicit
let text_index_params = TextIndexParamsBuilder::new(TokenizerType::Word)
    .stopwords(StopwordsSet {
        languages: vec![
            "english".to_string(),
            "spanish".to_string(),
        ],
        custom: vec!["example".to_string()],
    });

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new(
            "{collection_name}",
            "{field_name}",
            FieldType::Text,
        ).field_index_params(text_index_params.build()),
    )
    .await?;
```
