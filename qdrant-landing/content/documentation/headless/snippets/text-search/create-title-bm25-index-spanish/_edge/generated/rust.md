```rust
use qdrant_edge::*;

edge_shard.update(UpdateOperation::FieldIndexOperation(
    FieldIndexOperations::CreateIndex(CreateIndex {
        field_name: "title".try_into().unwrap(),
        field_schema: Some(PayloadFieldSchema::FieldParams(PayloadSchemaParams::Text(
            TextIndexParamsBuilder::new()
                .stemmer(StemmingAlgorithm::Snowball(SnowballParams {
                    r#type: Snowball::Snowball,
                    language: SnowballLanguage::Spanish,
                }))
                .stopwords(StopwordsInterface::Language(Language::Spanish))
                .scoring(TextScoringParams::default())
                .build(),
        ))),
    }),
))?;
```
