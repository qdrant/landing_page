use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let results = edge_shard.query(
        QueryRequestBuilder::new(10)
            .add_prefetch(
                PrefetchBuilder::new(100)
                    .add_prefetch(
                        PrefetchBuilder::new(100)
                            .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                                query: VectorInternal::Sparse(SparseVector::new(vec![1, 42], vec![0.22, 0.8])?),
                                using: Some("sparse".to_string()),
                            })))
                            .build(),
                    )
                    .add_prefetch(
                        PrefetchBuilder::new(100)
                            .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                                query: vec![0.01f32, 0.45, 0.67].into(),
                                using: Some("dense".to_string()),
                            })))
                            .build(),
                    )
                    .query(ScoringQuery::Fusion(Fusion::Rrf { k: 2, weights: None }))
                    .build(),
            )
            .query(ScoringQuery::Formula(
                Formula {
                    formula: Expression::Sum(vec![
                        Expression::Variable("$score".to_string()),
                        Expression::Mult(vec![
                            Expression::Constant(0.1),
                            Expression::Decay {
                                kind: DecayKind::Exp,
                                x: Box::new(Expression::DatetimeKey(
                                    "published_at".try_into().unwrap(),
                                )),
                                target: Some(Box::new(Expression::Datetime(
                                    "YYYY-MM-DDT00:00:00Z".to_string(),
                                ))),
                                midpoint: Some(0.5),
                                scale: Some(86400.0 * 180.0),
                            },
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
