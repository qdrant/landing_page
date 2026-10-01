```rust
use qdrant_edge::*;

edge_shard.scroll(
    ScrollRequestBuilder::new()
        .filter(Filter::new_should(Condition::Field(
            FieldCondition::new_match(
                "country.cities[].sightseeing".try_into().unwrap(),
                "Osaka Castle".to_string().into(),
            ),
        )))
        .build(),
)?;
```
