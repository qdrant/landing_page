use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    edge_shard.scroll(
        ScrollRequestBuilder::new()
            .filter(Filter {
                must_not: Some(vec![
                    Condition::Field(FieldCondition::new_match(
                        "city".try_into().unwrap(),
                        "London".to_string().into(),
                    )),
                    Condition::Field(FieldCondition::new_match(
                        "color".try_into().unwrap(),
                        "red".to_string().into(),
                    )),
                ]),
                ..Default::default()
            })
            .build(),
    )?;

    Ok(())
}
