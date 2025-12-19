```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Datatype, Distance, SparseIndexConfigBuilder,
    SparseVectorParamsBuilder, SparseVectorsConfigBuilder, VectorParamsBuilder,
};

use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let mut sparse_vector_config = SparseVectorsConfigBuilder::default();

sparse_vector_config.add_named_vector_params(
    "text",
    SparseVectorParamsBuilder::default()
        .index(SparseIndexConfigBuilder::default().datatype(Datatype::Uint8)),
);
let create_collection = CreateCollectionBuilder::new("{collection_name}")
    .sparse_vectors_config(sparse_vector_config)
    .vectors_config(
        VectorParamsBuilder::new(128, Distance::Cosine)
            .datatype(Datatype::Uint8)
    );

client.create_collection(create_collection).await?;
```
