use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let results = edge_shard.query(
        QueryRequestBuilder::new(10)
            .add_prefetch(
                PrefetchBuilder::new(100)
                    .add_prefetch(
                        PrefetchBuilder::new(1000)
                            .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                                query: vec![1.0f32, 23.0, 45.0, 67.0].into(),
                                using: Some("mrl_byte".to_string()),
                            })))
                            .build(),
                    )
                    .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                        query: vec![0.01f32, 0.45, 0.67].into(),
                        using: Some("full".to_string()),
                    })))
                    .build(),
            )
            .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                query: TypedMultiDenseVector::<f32>::try_from_matrix(vec![
                    vec![0.17f32, 0.23, 0.52],  // <─┐
                    vec![0.22, 0.11, 0.63],      // < ├─ multi-vector
                    vec![0.86, 0.93, 0.12],      // < ┘
                ])?.into(),
                using: Some("colbert".to_string()),
            })))
            .build(),
    )?;

    Ok(())
}
