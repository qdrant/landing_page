```rust
use qdrant_client::qdrant::{Condition, DatetimeRange, Timestamp};

Condition::datetime_range(
    "date",
    DatetimeRange {
        gt: Some(Timestamp::date_time(2023, 2, 8, 10, 49, 0).unwrap()),
        gte: None,
        lt: None,
        lte: Some(Timestamp::date_time(2024, 1, 31, 10, 14, 31).unwrap()),
    },
)
```
