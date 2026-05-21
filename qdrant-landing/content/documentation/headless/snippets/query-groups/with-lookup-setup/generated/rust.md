```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, CreateFieldIndexCollectionBuilder, Distance, FieldType,
    VectorParamsBuilder, VectorsConfigBuilder,
};

client
    .create_collection(
        CreateCollectionBuilder::new("chunks")
            .vectors_config(VectorParamsBuilder::new(4, Distance::Cosine)),
    )
    .await?;

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new("chunks", "document_id", FieldType::Integer)
            .wait(true),
    )
    .await?;

// No vectors, payload only.
client
    .create_collection(
        CreateCollectionBuilder::new("documents")
            .vectors_config(VectorsConfigBuilder::default()),
    )
    .await?;
```
