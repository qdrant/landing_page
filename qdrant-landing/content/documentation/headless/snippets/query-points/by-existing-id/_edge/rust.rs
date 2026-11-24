// Qdrant Edge doesn't support querying by point ID, but it can be implemented as follows.
// A dedicated API only helps on a server, where it saves a second request. On Edge, both
// calls are local, so retrieving the vector and then querying with it is just as efficient.
use anyhow::Context;
use qdrant_edge::external::uuid::Uuid;
use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let point_id = PointId::Uuid(Uuid::parse_str("43cf51e2-8777-4f52-bc74-c2cbde0c8b04")?);

    let points = edge_shard.retrieve(
        RetrieveRequestBuilder::new(vec![point_id])
            .with_payload(WithPayloadInterface::Bool(false))
            .with_vector(WithVector::Bool(true))
            .build(),
    )?;
    let vector = points
        .first()
        .and_then(|point| point.get_vector_by_name(DEFAULT_VECTOR_NAME))
        .context("point not found")?;

    let results = edge_shard.query(
        QueryRequestBuilder::new(10)
            .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                query: vector.to_owned(),
                using: None,
            })))
            // Exclude the point itself from the results
            .filter(Filter::new_must_not(Condition::HasId(
                [point_id].into_iter().collect(),
            )))
            .build(),
    )?;

    Ok(())
}
