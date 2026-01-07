```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{CreateFieldIndexCollectionBuilder, FieldType};

client
    .create_field_index(CreateFieldIndexCollectionBuilder::new(
        "books",
        "author",
        FieldType::Keyword,
    ))
    .await?;
```
