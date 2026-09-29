use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    Condition::Field(FieldCondition::new_match(
        "description".try_into().unwrap(),
        Match::Phrase(MatchPhrase {
            phrase: "brown fox".to_string(),
        }),
    ));

    Ok(())
}
