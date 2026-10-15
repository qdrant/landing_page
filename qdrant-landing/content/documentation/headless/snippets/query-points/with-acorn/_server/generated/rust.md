```rust
use qdrant_client::qdrant::{
    AcornSearchParamsBuilder, QueryPointsBuilder, SearchParamsBuilder,
};
use qdrant_client::Qdrant;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![0.2, 0.1, 0.9, 0.7])
            .limit(10)
            .params(
                SearchParamsBuilder::default().acorn(
                    AcornSearchParamsBuilder::new(true)
                        .max_selectivity(0.4),
                ),
            ),
    )
    .await?;
```
