```rust
use qdrant_client::qdrant::{
    CreateFieldIndexCollectionBuilder,
    IntegerIndexParamsBuilder,
    FieldType
};
use qdrant_client::{Qdrant, QdrantError};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.create_field_index(
    CreateFieldIndexCollectionBuilder::new(
        "{collection_name}",
        "timestamp",
        FieldType::Integer,
    )
    .field_index_params(
        IntegerIndexParamsBuilder::default()
            .is_principal(true),
    ),
);
```
