use qdrant_edge::external::ordered_float::OrderedFloat;
use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    edge_shard.query(
        QueryRequestBuilder::new(10)
            .query(ScoringQuery::Mmr(Mmr {
                vector: vec![0.01f32, 0.45, 0.67].into(), // search vector
                using: DEFAULT_VECTOR_NAME.to_string(),
                lambda: OrderedFloat(0.5), // 0.0 - diversity; 1.0 - relevance
                candidates_limit: 100,     // num of candidates to preselect
            }))
            .build(),
    )?;

    Ok(())
}
