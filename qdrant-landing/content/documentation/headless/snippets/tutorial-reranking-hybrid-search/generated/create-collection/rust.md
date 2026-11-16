```rust
let collection_name = "hybrid-search";

if client.collection_exists(collection_name).await? {
    client.delete_collection(collection_name).await?;
}

let mut vectors = VectorsConfigBuilder::default();
vectors.add_named_vector_params(
    "dense",
    VectorParamsBuilder::new(384, Distance::Cosine),
);
vectors.add_named_vector_params(
    "multi",
    VectorParamsBuilder::new(96, Distance::Cosine)
        .multivector_config(MultiVectorConfigBuilder::new(MultiVectorComparator::MaxSim))
        .hnsw_config(HnswConfigDiffBuilder::default().m(0)), // Disable HNSW for reranking
);

client
    .create_collection(CreateCollectionBuilder::new(collection_name).vectors_config(vectors))
    .await?;

client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new(collection_name, "description", FieldType::Text)
            .field_index_params(
                TextIndexParamsBuilder::new(TokenizerType::Word)
                    .snowball_stemmer("english".to_string())
                    .stopwords_language("english".to_string())
                    .bm25_scoring() // Enable BM25 scoring
                    .build(),
            ),
    )
    .await?;
```
