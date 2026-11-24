```rust
use qdrant_edge::*;

Condition::Field(FieldCondition::new_geo_bounding_box(
    "location".try_into().unwrap(),
    GeoBoundingBox {
        bottom_right: GeoPoint::new(13.455868, 52.495862).unwrap(),
        top_left: GeoPoint::new(13.403683, 52.520711).unwrap(),
    },
));
```
