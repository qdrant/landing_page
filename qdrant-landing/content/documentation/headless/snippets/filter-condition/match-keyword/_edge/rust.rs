use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    Condition::Field(FieldCondition::new_match(
        "color".try_into().unwrap(),
        Match::new_value(ValueVariants::String("red".to_string())),
    ));

    Ok(())
}
