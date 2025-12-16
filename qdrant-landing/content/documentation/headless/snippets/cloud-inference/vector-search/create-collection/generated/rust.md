```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, Modifier, SparseVectorParamsBuilder,
    SparseVectorsConfigBuilder, VectorParamsBuilder, VectorsConfigBuilder,
};

let mut vector_config = VectorsConfigBuilder::default();
vector_config.add_named_vector_params(
    "dense_vector",
    VectorParamsBuilder::new(384, Distance::Cosine),
);

let mut sparse_vectors_config = SparseVectorsConfigBuilder::default();
sparse_vectors_config.add_named_vector_params(
    "bm25_sparse_vector",
    SparseVectorParamsBuilder::default().modifier(Modifier::Idf), // Enable Inverse Document Frequency
);

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(vector_config)
            .sparse_vectors_config(sparse_vectors_config),
    )
    .await?;
```
