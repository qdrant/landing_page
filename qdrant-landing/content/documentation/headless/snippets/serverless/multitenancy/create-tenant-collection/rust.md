```rust
use qdrant_client::serverless::{CollectionConfig, DenseVectorConfig, Distance};

let tenant_id = "acme";

client
    .create_collection(
        format!("tenant-{tenant_id}"),
        CollectionConfig::new().dense_vector(DenseVectorConfig::new(384, Distance::Cosine)),
    )
    .await?;
```
