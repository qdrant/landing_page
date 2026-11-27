```rust
use qdrant_client::qdrant::{CreateFieldIndexCollectionBuilder, FieldType};
use qdrant_client::Qdrant;

client
    .create_field_index(CreateFieldIndexCollectionBuilder::new(
        "venues",
        "location",
        FieldType::Geo,
    ))
    .await?;
```
