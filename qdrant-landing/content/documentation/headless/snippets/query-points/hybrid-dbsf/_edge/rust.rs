use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let results = edge_shard.query(
        QueryRequestBuilder::new(10)
            .add_prefetch(
                PrefetchBuilder::new(20)
                    .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                        query: VectorInternal::Sparse(SparseVector::new(vec![1, 42], vec![0.22, 0.8])?),
                        using: Some("sparse".to_string()),
                    })))
                    .build(),
            )
            .add_prefetch(
                PrefetchBuilder::new(20)
                    .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                        query: vec![0.01f32, 0.45, 0.67].into(),
                        using: Some("dense".to_string()),
                    })))
                    .build(),
            )
            .query(ScoringQuery::Fusion(Fusion::Dbsf))
            .build(),
    )?;

    Ok(())
}
