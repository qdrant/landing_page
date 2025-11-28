```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, VectorParamsBuilder, VectorsConfigBuilder,
};

let client = Qdrant::from_url("http://localhost:6334").build()?;

let mut vectors_config = VectorsConfigBuilder::default();
vectors_config
    .add_named_vector_params("image", VectorParamsBuilder::new(4, Distance::Dot).build());
vectors_config.add_named_vector_params(
    "text",
    VectorParamsBuilder::new(8, Distance::Cosine).build(),
);

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}").vectors_config(vectors_config),
    )
    .await?;
```
