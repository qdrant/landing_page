```rust
let filter = Filter::new_must(Condition::Field(FieldCondition::new_range(
    SYNC_TIMESTAMP_KEY.parse::<JsonPath>().unwrap(),
    Range {
        lte: Some(OrderedFloat(sync_timestamp)),
        ..Default::default()
    },
)));

mutable_shard.update(PointOperation(DeletePointsByFilter(filter)))?;
```
