use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let dense_vector: Vec<f32> = vec![0.01, 0.45, 0.67]; // <-- all-MiniLM-L6-v2 embedding of "time travel"

    let results = edge_shard.query(
        QueryRequestBuilder::new(10)
            .add_prefetch(
                PrefetchBuilder::new(10)
                    .query(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
                        query: dense_vector.into(),
                        using: Some("description-dense".to_string()),
                    })))
                    .score_threshold(0.5)
                    .build(),
            )
            .add_prefetch(
                PrefetchBuilder::new(10)
                    .query(TextQueryBuilder::new("title".try_into().unwrap(), "time travel").build())
                    .build(),
            )
            .query(ScoringQuery::Fusion(Fusion::Rrf { k: 2, weights: None }))
            .with_payload(WithPayloadInterface::Bool(true))
            .build(),
    )?;

    Ok(())
}
