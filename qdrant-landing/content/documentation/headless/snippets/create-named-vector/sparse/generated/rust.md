```rust
use qdrant_client::qdrant::{
    CreateVectorNameRequestBuilder, Modifier, SparseVectorCreationConfigBuilder,
};
use qdrant_client::Qdrant;

client
    .create_vector_name(
        CreateVectorNameRequestBuilder::new(
            "{collection_name}",
            "{vector_name}",
            SparseVectorCreationConfigBuilder::new().modifier(Modifier::Idf),
        ),
    )
    .await?;
```
