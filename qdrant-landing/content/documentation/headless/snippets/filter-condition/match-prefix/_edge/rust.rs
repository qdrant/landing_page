use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    Condition::Field(FieldCondition::new_match(
        "url".try_into().unwrap(),
        Match::new_prefix("https://qdrant."),
    ));

    Ok(())
}
