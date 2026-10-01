use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    edge_shard.scroll(
        ScrollRequestBuilder::new()
            .filter(Filter::new_should(Condition::Field(
                FieldCondition::new_match(
                    "country.name".try_into().unwrap(),
                    "Germany".to_string().into(),
                ),
            )))
            .build(),
    )?;

    Ok(())
}
