use ordered_float::OrderedFloat;
use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    Condition::Field(FieldCondition::new_geo_radius(
        "location".try_into().unwrap(),
        GeoRadius {
            center: GeoPoint::new(13.403683, 52.520711).unwrap(),
            radius: OrderedFloat(1000.0),
        },
    ));

    Ok(())
}
