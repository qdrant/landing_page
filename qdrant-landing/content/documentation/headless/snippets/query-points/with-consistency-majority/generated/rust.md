```rust
use qdrant_client::qdrant::{
    read_consistency::Value, Condition, Filter, QueryPointsBuilder, ReadConsistencyType,
    SearchParamsBuilder,
};
use qdrant_client::Qdrant;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![0.2, 0.1, 0.9, 0.7])
            .limit(3)
            .filter(Filter::must([Condition::matches(
                "city",
                "London".to_string(),
            )]))
            .params(SearchParamsBuilder::default().hnsw_ef(128).exact(false))
            .read_consistency(Value::Type(ReadConsistencyType::Majority.into())),
    )
    .await?;
```
