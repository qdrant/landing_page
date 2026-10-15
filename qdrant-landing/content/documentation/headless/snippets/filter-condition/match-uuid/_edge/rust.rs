use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    Condition::Field(FieldCondition::new_match(
        "uuid".try_into().unwrap(),
        Match::new_value(ValueVariants::String(
            "f47ac10b-58cc-4372-a567-0e02b2c3d479".to_string(),
        )),
    ));

    Ok(())
}
