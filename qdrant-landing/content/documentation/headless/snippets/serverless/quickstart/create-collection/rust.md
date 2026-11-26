```rust
use qdrant_client::serverless::{
    CollectionConfig, DenseVectorConfig, Distance, StopwordsSet, TextIndex, Tokenizer,
};

client
    .create_collection(
        "menu",
        CollectionConfig::new()
            .named_dense_vector("dense", DenseVectorConfig::new(384, Distance::Cosine))
            .payload_index(
                "description",
                TextIndex::new()
                    .tokenizer(Tokenizer::Word)
                    .stopwords(StopwordsSet::new().languages(["english"]))
                    .bm25_scoring(),
            ),
    )
    .await?;
```
