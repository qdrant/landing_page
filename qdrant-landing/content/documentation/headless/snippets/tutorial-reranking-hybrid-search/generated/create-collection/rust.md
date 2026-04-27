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

let mut sparse = SparseVectorsConfigBuilder::default();
sparse.add_named_vector_params(
    "sparse",
    SparseVectorParamsBuilder::default().modifier(Modifier::Idf),
);

client
    .create_collection(
        CreateCollectionBuilder::new(collection_name)
            .vectors_config(vectors)
            .sparse_vectors_config(sparse),
    )
    .await?;
```
