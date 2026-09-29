use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    edge_shard.scroll(
        ScrollRequestBuilder::new()
            .filter(Filter::new_must(Condition::HasVector(
                HasVectorCondition::from("image".to_string()),
            )))
            .build(),
    )?;

    Ok(())
}
