```rust
use qdrant_client::qdrant::{Condition, GeoLineString, GeoPoint, GeoPolygon};

Condition::geo_polygon(
    "location",
    GeoPolygon {
        exterior: Some(GeoLineString {
            points: vec![
                GeoPoint {
                    lon: -70.0,
                    lat: -70.0,
                },
                GeoPoint {
                    lon: 60.0,
                    lat: -70.0,
                },
                GeoPoint {
                    lon: 60.0,
                    lat: 60.0,
                },
                GeoPoint {
                    lon: -70.0,
                    lat: 60.0,
                },
                GeoPoint {
                    lon: -70.0,
                    lat: -70.0,
                },
            ],
        }),
        interiors: vec![GeoLineString {
            points: vec![
                GeoPoint {
                    lon: -65.0,
                    lat: -65.0,
                },
                GeoPoint {
                    lon: 0.0,
                    lat: -65.0,
                },
                GeoPoint { lon: 0.0, lat: 0.0 },
                GeoPoint {
                    lon: -65.0,
                    lat: 0.0,
                },
                GeoPoint {
                    lon: -65.0,
                    lat: -65.0,
                },
            ],
        }],
    },
)
```
