```rust
use qdrant_edge::*;

edge_shard.scroll(
    ScrollRequestBuilder::new()
        .filter(Filter::new_must(Condition::new_nested(
            "diet".try_into().unwrap(),
            Filter {
                must: Some(vec![
                    Condition::Field(FieldCondition::new_match(
                        "food".try_into().unwrap(),
                        "meat".to_string().into(),
                    )),
                    Condition::Field(FieldCondition::new_match(
                        "likes".try_into().unwrap(),
                        true.into(),
                    )),
                ]),
                ..Default::default()
            },
        )))
        .build(),
)?;
```
