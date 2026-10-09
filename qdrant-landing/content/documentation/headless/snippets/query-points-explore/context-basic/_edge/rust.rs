use std::collections::HashMap;

use anyhow::Context;
use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    // Look up the stored vectors of the context points
    let records = edge_shard.retrieve(
        RetrieveRequestBuilder::new([100, 718, 200, 300].map(PointId::from).to_vec())
            .with_payload(WithPayloadInterface::Bool(false))
            .with_vector(WithVector::Bool(true))
            .build(),
    )?;
    let mut vectors: HashMap<PointId, VectorInternal> = HashMap::new();
    for record in &records {
        let vector = record
            .get_vector_by_name(DEFAULT_VECTOR_NAME)
            .context("point has no vector")?;
        vectors.insert(record.id, vector.to_owned());
    }
    let mut take = |id: u64| vectors.remove(&PointId::from(id)).context("point not found");

    edge_shard.query(
        QueryRequestBuilder::new(10)
            .query(ScoringQuery::Vector(QueryEnum::Context(NamedQuery {
                query: ContextQuery::new(vec![
                    ContextPair {
                        positive: take(100)?,
                        negative: take(718)?,
                    },
                    ContextPair {
                        positive: take(200)?,
                        negative: take(300)?,
                    },
                ]),
                using: None,
            })))
            .build(),
    )?;

    Ok(())
}
