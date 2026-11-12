```rust
use qdrant_edge::*;

let results = edge_shard.query(
    QueryRequestBuilder::new(10)
        .query(TextQueryBuilder::new("title".try_into().unwrap(), "time travel").build())
        .filter(Filter {
            must: Some(vec![
                Condition::Field(FieldCondition::new_match(
                    "group_id".try_into().unwrap(),
                    "user_1".to_string().into(),
                )),
                Condition::Field(FieldCondition::new_match(
                    "year".try_into().unwrap(),
                    Match::new_value(ValueVariants::Integer(2024)),
                )),
            ]),
            ..Default::default()
        })
        .params(SearchParams {
            idf: Some(IdfParams::Corpus(IdfCorpusParams {
                corpus: Filter::new_must(Condition::Field(FieldCondition::new_match(
                    "group_id".try_into().unwrap(),
                    "user_1".to_string().into(),
                ))),
            })),
            ..Default::default()
        })
        .with_payload(WithPayloadInterface::Bool(true))
        .build(),
)?;
```
