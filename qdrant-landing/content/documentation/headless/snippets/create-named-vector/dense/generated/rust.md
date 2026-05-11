```rust
use qdrant_client::qdrant::{
    CreateVectorNameRequestBuilder, DenseVectorCreationConfigBuilder, Distance,
};
use qdrant_client::Qdrant;

client
    .create_vector_name(
        CreateVectorNameRequestBuilder::new(
            "{collection_name}",
            "{vector_name}",
            DenseVectorCreationConfigBuilder::new(256, Distance::Cosine),
        ),
    )
    .await?;
```
