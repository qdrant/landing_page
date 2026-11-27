```rust
use qdrant_client::qdrant::{Condition, Document, Filter, GeoPoint, GeoRadius, Query, QueryPointsBuilder};
use qdrant_client::Qdrant;

let results = client
    .query(
        QueryPointsBuilder::new("venues")
            .query(Query::new_nearest(Document::new(
                "quiet café to work from",
                "sentence-transformers/all-minilm-l6-v2",
            )))
            .filter(Filter::must([Condition::geo_radius(
                "location",
                GeoRadius {
                    center: Some(GeoPoint {
                        lon: 13.403683,
                        lat: 52.520711,
                    }),
                    radius: 1500.0,
                },
            )]))
            .limit(5),
    )
    .await?;
```
