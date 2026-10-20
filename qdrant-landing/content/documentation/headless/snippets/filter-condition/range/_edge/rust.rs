use ordered_float::OrderedFloat;
use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    Condition::Field(FieldCondition::new_range(
        "price".try_into().unwrap(),
        Range {
            gt: None,
            gte: Some(OrderedFloat(100.0)),
            lt: None,
            lte: Some(OrderedFloat(450.0)),
        },
    ));

    Ok(())
}
