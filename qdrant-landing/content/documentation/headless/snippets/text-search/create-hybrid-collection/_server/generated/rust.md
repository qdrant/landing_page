```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, CreateFieldIndexCollectionBuilder, Distance, FieldType,
    TextIndexParamsBuilder, TokenizerType, VectorParamsBuilder, VectorsConfigBuilder,
};

let mut vectors = VectorsConfigBuilder::default();
vectors.add_named_vector_params(
    "description-dense",
    VectorParamsBuilder::new(384, Distance::Cosine),
);

client
    .create_collection(CreateCollectionBuilder::new("books").vectors_config(vectors))
    .await?;

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new("books", "title", FieldType::Text)
            .field_index_params(
                TextIndexParamsBuilder::new(TokenizerType::Word)
                    .bm25_scoring()
                    .build(),
            ),
    )
    .await?;
```
