```rust
use qdrant_client::qdrant::DeleteVectorNameRequestBuilder;
use qdrant_client::Qdrant;

client
    .delete_vector_name(DeleteVectorNameRequestBuilder::new(
        "{collection_name}",
        "{vector_name}",
    ))
    .await?;
```
