use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let _best_fields = edge_shard.query(
        QueryRequestBuilder::new(10)
            .add_prefetch(
                PrefetchBuilder::new(50)
                    .query(TextQueryBuilder::new("title".try_into().unwrap(), "vector database").build())
                    .build(),
            )
            .add_prefetch(
                PrefetchBuilder::new(50)
                    .query(TextQueryBuilder::new("body".try_into().unwrap(), "vector database").build())
                    .build(),
            )
            .query(ScoringQuery::Formula(
                Formula {
                    formula: Expression::Max(vec![
                        // boost title matches
                        Expression::Mult(vec![
                            Expression::Constant(3.0),
                            Expression::Variable("$score[0]".to_string()),
                        ]),
                        Expression::Variable("$score[1]".to_string()),
                    ]),
                    defaults: Default::default(),
                }
                .try_into()?,
            ))
            .build(),
    )?;

    Ok(())
}
