use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    Condition::IsNull(IsNullCondition::from(
        "reports".parse::<JsonPath>().unwrap(),
    ));

    Ok(())
}
