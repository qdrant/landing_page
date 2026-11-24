use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    edge_shard.scroll(
        ScrollRequestBuilder::new()
            .filter(Filter {
                must: Some(vec![
                    Condition::Field(FieldCondition::new_match(
                        "diet[].food".try_into().unwrap(),
                        "meat".to_string().into(),
                    )),
                    Condition::Field(FieldCondition::new_match(
                        "diet[].likes".try_into().unwrap(),
                        true.into(),
                    )),
                ]),
                ..Default::default()
            })
            .build(),
    )?;

    Ok(())
}
