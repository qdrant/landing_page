use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    edge_shard.scroll(
        ScrollRequestBuilder::new()
            .filter(Filter::new_must(Condition::Slice(SliceCondition {
                slice: Slice {
                    total: std::num::NonZeroU32::new(8).unwrap(),
                    index: 3,
                },
            })))
            .build(),
    )?;

    Ok(())
}
