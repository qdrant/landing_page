use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let _clamped = edge_shard.query(
        QueryRequestBuilder::new(10)
            .add_prefetch(
                PrefetchBuilder::new(50)
                    .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                        query: vec![0.01f32, 0.45, 0.67].into(),
                        using: None,
                    })))
                    .build(),
            )
            .query(ScoringQuery::Formula(
                Formula {
                    formula: Expression::Sum(vec![
                        Expression::Variable("$score".to_string()),
                        // clamp `rating` into the range [0, 1]
                        Expression::Max(vec![
                            Expression::Constant(0.0),
                            Expression::Min(vec![
                                Expression::Constant(1.0),
                                Expression::Variable("rating".to_string()),
                            ]),
                        ]),
                    ]),
                    defaults: Default::default(),
                }
                .try_into()?,
            ))
            .build(),
    )?;

    Ok(())
}
