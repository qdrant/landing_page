use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    Condition::Field(FieldCondition::new_match(
        "description".try_into().unwrap(),
        Match::new_text("good cheap"),
    ));

    Ok(())
}
