use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    Condition::Field(FieldCondition::new_match(
        "color".try_into().unwrap(),
        Match::Except(vec!["black".to_string(), "yellow".to_string()].into()),
    ));

    Ok(())
}
