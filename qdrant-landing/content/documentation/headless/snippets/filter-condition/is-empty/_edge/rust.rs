use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    Condition::IsEmpty(IsEmptyCondition::from(
        "reports".parse::<JsonPath>().unwrap(),
    ));

    Ok(())
}
