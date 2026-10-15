use ordered_float::OrderedFloat;
use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    edge_shard.scroll(
        ScrollRequestBuilder::new()
            .filter(Filter::new_should(Condition::Field(
                FieldCondition::new_range(
                    "country.cities[].population".try_into().unwrap(),
                    Range {
                        gte: Some(OrderedFloat(9.0)),
                        ..Default::default()
                    },
                ),
            )))
            .build(),
    )?;

    Ok(())
}
