```rust
use qdrant_client::qdrant::{
    payload_index_params::IndexParams, CreateFieldIndexCollectionBuilder, FieldType,
    IntegerIndexParams, PayloadIndexParams,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new(
            "{collection_name}",
            "name_of_the_field_to_index",
            FieldType::Integer,
        )
        .field_index_params(PayloadIndexParams {
            index_params: Some(IndexParams::IntegerIndexParams(IntegerIndexParams {
                lookup: false,
                range: true,
            })),
        }),
    )
    .await?;
```
