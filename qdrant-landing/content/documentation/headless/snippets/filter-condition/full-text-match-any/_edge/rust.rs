use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    Condition::Field(FieldCondition::new_match(
        "description".try_into().unwrap(),
        Match::TextAny(MatchTextAny {
            text_any: "good cheap".to_string(),
        }),
    ));

    Ok(())
}
