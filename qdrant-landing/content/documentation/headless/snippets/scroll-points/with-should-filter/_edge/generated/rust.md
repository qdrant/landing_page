```rust
use qdrant_edge::*;

edge_shard.scroll(
    ScrollRequestBuilder::new()
        .filter(Filter {
            should: Some(vec![
                Condition::Field(FieldCondition::new_match(
                    "city".try_into().unwrap(),
                    "London".to_string().into(),
                )),
                Condition::Field(FieldCondition::new_match(
                    "color".try_into().unwrap(),
                    "red".to_string().into(),
                )),
            ]),
            ..Default::default()
        })
        .build(),
)?;
```
