// Qdrant Edge doesn't support looking up vectors from another collection, but it can be
// implemented as follows. Each Edge shard holds a single collection, so load a second shard
// for the other collection, retrieve the vector from it, and query with that vector.
use anyhow::Context;
use qdrant_edge::external::uuid::Uuid;
use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let another_shard = EdgeShard::load(std::path::Path::new("./another-shard"), None)?;

    let point_id = PointId::Uuid(Uuid::parse_str("43cf51e2-8777-4f52-bc74-c2cbde0c8b04")?);

    let points = another_shard.retrieve(
        RetrieveRequestBuilder::new(vec![point_id])
            .with_payload(WithPayloadInterface::Bool(false))
            .with_vector(WithVector::Selector(vec!["image-512".to_string()]))
            .build(),
    )?;
    let vector = points
        .first()
        .and_then(|point| point.get_vector_by_name("image-512"))
        .context("point not found")?;

    let results = edge_shard.query(
        QueryRequestBuilder::new(10)
            .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                query: vector.to_owned(),
                using: Some("512d-vector".to_string()),
            })))
            .build(),
    )?;

    Ok(())
}
