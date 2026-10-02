use std::collections::HashMap;

use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    // Look up the stored "image" vectors of the example points
    let records = edge_shard.retrieve(
        RetrieveRequestBuilder::new([100, 231, 718].map(PointId::from).to_vec())
            .with_payload(WithPayloadInterface::Bool(false))
            .with_vector(WithVector::Selector(vec!["image".to_string()]))
            .build(),
    )?;
    let mut vectors: HashMap<PointId, VectorInternal> = records
        .iter()
        .map(|record| {
            let vector = record.get_vector_by_name("image").unwrap();
            (record.id, vector.to_owned())
        })
        .collect();
    let mut take = |id: u64| vectors.remove(&PointId::from(id)).unwrap();

    edge_shard.query(
        QueryRequestBuilder::new(10)
            .query(ScoringQuery::Vector(QueryEnum::RecommendBestScore(NamedQuery {
                query: RecommendQuery::new(vec![take(100), take(231)], vec![take(718)]),
                using: Some("image".to_string()),
            })))
            .build(),
    )?;

    Ok(())
}
