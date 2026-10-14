```rust
use qdrant_client::qdrant::{
    Document, Expression, FormulaBuilder, PrefetchQueryBuilder, Query, QueryPointsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let _best_fields = client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .query(Query::new_nearest(Document::new("vector database", "qdrant/bm25")))
                    .using("title-bm25")
                    .limit(50u64),
            )
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .query(Query::new_nearest(Document::new("vector database", "qdrant/bm25")))
                    .using("body-bm25")
                    .limit(50u64),
            )
            .query(FormulaBuilder::new(Expression::max_with([
                // boost title matches
                Expression::mult_with([
                    Expression::constant(3.0),
                    Expression::variable("$score[0]"),
                ]),
                Expression::variable("$score[1]"),
            ])))
            .limit(10),
    )
    .await?;
```
