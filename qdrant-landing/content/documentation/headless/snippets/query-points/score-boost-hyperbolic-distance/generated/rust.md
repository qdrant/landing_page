```rust
use qdrant_client::qdrant::{
    Expression, FormulaBuilder, PrefetchQueryBuilder, QueryPointsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let _geodesic = client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    // the time coordinate (the first value) is negated
                    .query(vec![-3.2, 0.3, 0.4])
                    .limit(100u64),
            )
            .query(FormulaBuilder::new(Expression::mult_with([
                Expression::constant(-3.1622776601683795), // -1 / sqrt(0.1)
                Expression::acosh(Expression::mult_with([
                    Expression::constant(0.1),
                    Expression::neg(Expression::score()),
                ])),
            ])))
            .limit(10),
    )
    .await?;
```
