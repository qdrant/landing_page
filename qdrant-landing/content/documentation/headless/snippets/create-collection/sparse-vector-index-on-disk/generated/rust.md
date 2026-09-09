```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Memory, SparseIndexConfigBuilder, SparseVectorParamsBuilder,
    SparseVectorsConfigBuilder,
};
use qdrant_client::Qdrant;

let mut sparse_vectors_config = SparseVectorsConfigBuilder::default();

sparse_vectors_config.add_named_vector_params(
    "text",
    SparseVectorParamsBuilder::default()
        .index(SparseIndexConfigBuilder::default().memory(Memory::Cold)),
);

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .sparse_vectors_config(sparse_vectors_config),
    )
    .await?;
```
