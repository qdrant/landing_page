```rust
use qdrant_edge::*;

edge_shard.scroll(
    ScrollRequestBuilder::new()
        .filter(Filter::new_should(Condition::Field(
            FieldCondition::new_match(
                "country.name".try_into().unwrap(),
                "Germany".to_string().into(),
            ),
        )))
        .build(),
)?;
```
