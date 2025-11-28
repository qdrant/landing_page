```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Datatype, Distance, VectorParamsBuilder,
};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}").vectors_config(
            VectorParamsBuilder::new(1024, Distance::Cosine).datatype(Datatype::Uint8),
        ),
    )
    .await?;
```
