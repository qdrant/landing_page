```rust
use qdrant_edge::*;

shard.update(UpdateOperation::FieldIndexOperation(
    FieldIndexOperations::CreateIndex(CreateIndex {
        field_name: "title".try_into().unwrap(),
        field_schema: Some(PayloadFieldSchema::FieldParams(PayloadSchemaParams::Text(
            TextIndexParamsBuilder::new()
                .scoring(TextScoringParams::default())
                .stemmer(StemmingAlgorithm::Snowball(SnowballParams {
                    r#type: Snowball::Snowball,
                    language: SnowballLanguage::English,
                }))
                .stopwords(StopwordsInterface::Language(Language::English))
                .build(),
        ))),
    }),
))?;
```
