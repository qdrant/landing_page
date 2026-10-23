use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let seen_ids = vec![83461u64, 19284, 57392, 44017, 91825]; // IDs returned on previous pages

    let results = edge_shard.query(
        QueryRequestBuilder::new(5)
            .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                query: vec![0.2f32, 0.1, 0.9, 0.7].into(),
                using: None,
            })))
            .filter(Filter::new_must_not(Condition::HasId(
                seen_ids.into_iter().map(PointId::NumId).collect(),
            )))
            .build(),
    )?;

    Ok(())
}
