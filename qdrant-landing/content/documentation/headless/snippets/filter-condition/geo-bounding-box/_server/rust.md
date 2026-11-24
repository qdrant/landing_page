```rust
use qdrant_client::qdrant::{Condition, GeoBoundingBox, GeoPoint};

Condition::geo_bounding_box(
    "location",
    GeoBoundingBox {
        bottom_right: Some(GeoPoint {
            lon: 13.455868,
            lat: 52.495862,
        }),
        top_left: Some(GeoPoint {
            lon: 13.403683,
            lat: 52.520711,
        }),
    },
)
```
