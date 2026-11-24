use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let sampled = edge_shard.query(
        QueryRequestBuilder::new(10)
            .query(ScoringQuery::Sample(Sample::Random))
            .build(),
    )?;

    Ok(())
}
