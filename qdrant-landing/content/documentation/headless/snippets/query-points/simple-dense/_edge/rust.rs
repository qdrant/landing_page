use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let results = edge_shard.query(
        QueryRequestBuilder::new(10)
            .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                query: vec![0.2f32, 0.1, 0.9, 0.7].into(), // <--- Dense vector
                using: None,
            })))
            .build(),
    )?;

    Ok(())
}
