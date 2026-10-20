// Qdrant Edge doesn't support looking up vectors from another collection, but it can be
// implemented as follows. Each Edge shard holds a single collection, so load a second shard
// for the other collection, retrieve the vectors from it, and recommend with those vectors.
use std::collections::HashMap;

use anyhow::Context;
use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let external_shard =
        EdgeShard::load(std::path::Path::new("./{external_collection_name}"), None)?;

    let points = external_shard.retrieve(
        RetrieveRequestBuilder::new([100, 231, 718].map(PointId::from).to_vec())
            .with_payload(WithPayloadInterface::Bool(false))
            .with_vector(WithVector::Selector(vec!["{external_vector_name}".to_string()]))
            .build(),
    )?;
    let mut vectors: HashMap<PointId, VectorInternal> = HashMap::new();
    for point in &points {
        let vector = point
            .get_vector_by_name("{external_vector_name}")
            .context("point has no vector")?;
        vectors.insert(point.id, vector.to_owned());
    }
    let mut take = |id: u64| vectors.remove(&PointId::from(id)).context("point not found");

    edge_shard.query(
        QueryRequestBuilder::new(10)
            .query(ScoringQuery::Vector(QueryEnum::RecommendBestScore(NamedQuery {
                query: RecommendQuery::new(vec![take(100)?, take(231)?], vec![take(718)?]),
                using: Some("image".to_string()),
            })))
            .build(),
    )?;

    Ok(())
}
