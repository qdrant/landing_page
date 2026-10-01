use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let _tag_boosted = edge_shard.query(
        QueryRequestBuilder::new(10)
            .add_prefetch(
                PrefetchBuilder::new(100)
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
                        Expression::Mult(vec![
                            Expression::Constant(0.5),
                            Expression::Condition(Box::new(Condition::Field(
                                FieldCondition::new_match(
                                    "tag".try_into().unwrap(),
                                    vec![
                                        "h1".to_string(),
                                        "h2".to_string(),
                                        "h3".to_string(),
                                        "h4".to_string(),
                                    ]
                                    .into(),
                                ),
                            ))),
                        ]),
                        Expression::Mult(vec![
                            Expression::Constant(0.25),
                            Expression::Condition(Box::new(Condition::Field(
                                FieldCondition::new_match(
                                    "tag".try_into().unwrap(),
                                    vec!["p".to_string(), "li".to_string()].into(),
                                ),
                            ))),
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
