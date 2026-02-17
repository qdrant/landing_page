```rust
use qdrant_client::qdrant::{
    FeedbackItemBuilder, FeedbackStrategyBuilder, PointId, Query, QueryPointsBuilder,
    RelevanceFeedbackInputBuilder, VectorInput,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let _points = client.query(
    QueryPointsBuilder::new("{collection_name}")
        .query(Query::new_relevance_feedback(
            RelevanceFeedbackInputBuilder::new(vec![0.01, 0.45, 0.67])
                .add_feedback(FeedbackItemBuilder::new(VectorInput::new_id(PointId::from(111)), 0.68))
                .add_feedback(FeedbackItemBuilder::new(VectorInput::new_id(PointId::from(222)), 0.72))
                .add_feedback(FeedbackItemBuilder::new(VectorInput::new_id(PointId::from(333)), 0.61))
                .strategy(FeedbackStrategyBuilder::naive(0.12, 0.43, 0.16))
        ))
        .limit(10u64)
).await?;
```
