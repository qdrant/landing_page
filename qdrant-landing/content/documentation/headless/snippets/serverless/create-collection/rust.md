```rust
use qdrant_client::serverless::{
    CollectionConfig, DenseVectorConfig, Distance, FloatIndex, KeywordIndex, PrecisionTier,
    SparseVectorConfig,
};

client
    .create_collection(
        "products",
        CollectionConfig::new()
            .named_dense_vector(
                "dense",
                DenseVectorConfig::new(1536, Distance::Cosine)
                    .precision_tier(PrecisionTier::Medium),
            )
            .named_sparse_vector("bm25", SparseVectorConfig::new().use_idf(true))
            .payload_index("category", KeywordIndex::new())
            .payload_index("price", FloatIndex),
    )
    .await?;
```
