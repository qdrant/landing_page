use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let _best_match = edge_shard.query(
        QueryRequestBuilder::new(10)
            .add_prefetch(
                PrefetchBuilder::new(50)
                    .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                        query: vec![0.01f32, 0.45, 0.67].into(),
                        using: Some("title".to_string()),
                    })))
                    .build(),
            )
            .add_prefetch(
                PrefetchBuilder::new(50)
                    .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                        query: vec![0.01f32, 0.45, 0.67].into(),
                        using: Some("summary".to_string()),
                    })))
                    .build(),
            )
            .query(ScoringQuery::Formula(
                Formula {
                    formula: Expression::Max(vec![
                        Expression::Variable("$score[0]".to_string()),
                        Expression::Variable("$score[1]".to_string()),
                    ]),
                    // used when a point is missing from the second prefetch
                    defaults: [("$score[1]".to_string(), serde_json::json!(-1e30))]
                        .into_iter()
                        .collect(),
                }
                .try_into()?,
            ))
            .build(),
    )?;

    Ok(())
}
