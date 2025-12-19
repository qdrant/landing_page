```rust
use qdrant_client::qdrant::{CreateCollectionBuilder, Modifier, SparseVectorParamsBuilder, SparseVectorsConfigBuilder};
use qdrant_client::Qdrant;

let mut sparse = SparseVectorsConfigBuilder::default();
sparse.add_named_vector_params("title-bm25", SparseVectorParamsBuilder::default().modifier(Modifier::Idf));

client
    .create_collection(
        CreateCollectionBuilder::new("books").sparse_vectors_config(sparse),
    )
    .await?;
```
