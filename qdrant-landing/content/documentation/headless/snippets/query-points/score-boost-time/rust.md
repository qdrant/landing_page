```rust
use qdrant_client::qdrant::{
    DecayParamsExpressionBuilder, Expression, FormulaBuilder, PrefetchQueryBuilder, QueryPointsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let _geo_boosted = client.query(
    QueryPointsBuilder::new("{collection_name}")
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .query(vec![0.2, 0.8, .., ..]) // <-- dense vector
                    .limit(50u64),
            )
            .query(
                FormulaBuilder::new(Expression::sum_with([ //  the final score = score + exp_decay(target_time - x_time)
                    Expression::score(),
                    Expression::exp_decay(
                        DecayParamsExpressionBuilder::new(Expression::datetime_key("update_time")) // payload key
                            .target(Expression::datetime("YYYY-MM-DDT00:00:00Z"))
                            .midpoint(0.5)
                            .scale(86400.0), // 1 day in seconds
                    ),
                ]))
            )
    )
    .await?;
```
