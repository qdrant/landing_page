use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    edge_shard.scroll(
        ScrollRequestBuilder::new()
            .filter(Filter::new_must(Condition::HasId(
                HasIdCondition::from_iter([1, 3, 5, 7, 9, 11].map(PointId::from)),
            )))
            .build(),
    )?;

    Ok(())
}
