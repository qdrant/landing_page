use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let results = edge_shard.query(
        QueryRequestBuilder::new(10)
            .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                query: VectorInternal::Sparse(SparseVector::new(
                    vec![1, 3, 5, 7],
                    vec![0.1, 0.2, 0.3, 0.4],
                )?),
                using: Some("text".to_string()),
            })))
            .build(),
    )?;

    Ok(())
}
