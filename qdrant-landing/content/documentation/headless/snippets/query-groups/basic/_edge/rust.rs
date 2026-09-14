use qdrant_edge::*;
use qdrant_edge::EdgeShardRead;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let results = edge_shard.query_groups(GroupRequest {
        query: QueryRequestBuilder::new(2)
            .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                query: vec![0.2f32, 0.1, 0.9, 0.7].into(),
                using: None,
            })))
            .with_payload(WithPayloadInterface::Bool(true))
            .with_vector(WithVector::Bool(true))
            .build(),
        group_by: "document_id".try_into().unwrap(),
        groups: 4,
        group_size: 2,
    })?;

    Ok(())
}
