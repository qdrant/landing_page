use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    Condition::Field(FieldCondition::new_geo_polygon(
        "location".try_into().unwrap(),
        GeoPolygon {
            exterior: GeoLineString {
                points: vec![
                    GeoPoint::new(-70.0, -70.0).unwrap(),
                    GeoPoint::new(60.0, -70.0).unwrap(),
                    GeoPoint::new(60.0, 60.0).unwrap(),
                    GeoPoint::new(-70.0, 60.0).unwrap(),
                    GeoPoint::new(-70.0, -70.0).unwrap(),
                ],
            },
            interiors: Some(vec![GeoLineString {
                points: vec![
                    GeoPoint::new(-65.0, -65.0).unwrap(),
                    GeoPoint::new(0.0, -65.0).unwrap(),
                    GeoPoint::new(0.0, 0.0).unwrap(),
                    GeoPoint::new(-65.0, 0.0).unwrap(),
                    GeoPoint::new(-65.0, -65.0).unwrap(),
                ],
            }]),
        },
    ));

    Ok(())
}
