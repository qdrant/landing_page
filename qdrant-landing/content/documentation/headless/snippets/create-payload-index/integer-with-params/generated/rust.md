```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder, FieldType, IntegerIndexParamsBuilder,
};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new(
            "{collection_name}",
            "name_of_the_field_to_index",
            FieldType::Integer,
        )
        .field_index_params(IntegerIndexParamsBuilder::new(false, true).build()),
    )
    .await?;
```
