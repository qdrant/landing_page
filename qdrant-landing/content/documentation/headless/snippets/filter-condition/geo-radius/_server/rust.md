```rust
use qdrant_client::qdrant::{Condition, GeoPoint, GeoRadius};

Condition::geo_radius(
    "location",
    GeoRadius {
        center: Some(GeoPoint {
            lon: 13.403683,
            lat: 52.520711,
        }),
        radius: 1000.0,
    },
)
```
