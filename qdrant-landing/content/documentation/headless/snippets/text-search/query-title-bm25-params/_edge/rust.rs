use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    let results = edge_shard.query(
        QueryRequestBuilder::new(10)
            .query(
                TextQueryBuilder::new("title".try_into().unwrap(), "time travel")
                    .scoring(TextQueryScoring::Bm25(
                        Bm25ParamsBuilder::new().k(1.5).b(0.5).build(),
                    ))
                    .build(),
            )
            .with_payload(WithPayloadInterface::Bool(true))
            .build(),
    )?;

    Ok(())
}
