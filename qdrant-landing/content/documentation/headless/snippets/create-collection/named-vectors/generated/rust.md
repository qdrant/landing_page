```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, SparseVectorParamsBuilder, SparseVectorsConfigBuilder,
    VectorParamsBuilder, VectorsConfigBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let mut vector_config = VectorsConfigBuilder::default();
vector_config.add_named_vector_params("text", VectorParamsBuilder::new(5, Distance::Dot));
vector_config.add_named_vector_params("image", VectorParamsBuilder::new(4, Distance::Cosine));

let mut sparse_vectors_config = SparseVectorsConfigBuilder::default();
sparse_vectors_config
    .add_named_vector_params("text-sparse", SparseVectorParamsBuilder::default());

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(vector_config)
            .sparse_vectors_config(sparse_vectors_config),
    )
    .await?;
```
