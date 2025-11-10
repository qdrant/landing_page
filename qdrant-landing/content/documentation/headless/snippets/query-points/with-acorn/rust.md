```rust
use qdrant_client::qdrant::{
    AcornSearchParamsBuilder, QueryPointsBuilder, SearchParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![0.2, 0.1, 0.9, 0.7])
            .limit(10)
            .params(
                SearchParamsBuilder::default().acorn(
                    AcornSearchParamsBuilder::default()
                        .enable(true)
                        .max_selectivity(0.4),
                ),
            ),
    )
    .await?;
```
