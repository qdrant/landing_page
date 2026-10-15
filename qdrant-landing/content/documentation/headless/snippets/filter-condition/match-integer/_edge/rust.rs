use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    Condition::Field(FieldCondition::new_match(
        "count".try_into().unwrap(),
        Match::new_value(ValueVariants::Integer(0)),
    ));

    Ok(())
}
