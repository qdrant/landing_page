use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let results = edge_shard.query(
        QueryRequestBuilder::new(10)
            .add_prefetch(
                PrefetchBuilder::new(100)
                    .query(TextQueryBuilder::new("title".try_into().unwrap(), "time travel").build())
                    .build(),
            )
            .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                query: vec![0.01f32, 0.45, 0.67].into(),
                using: Some("dense".to_string()),
            })))
            .build(),
    )?;

    Ok(())
}
