```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{PrefetchQueryBuilder, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        .query(Query::new_nearest_with_mmr(
            vec![0.01, 0.45, 0.67], // search vector
            MmrBuilder::empty()
                .diversity(0.5) // 0.0 - relevance; 1.0 - diversity
                .candidate_limit(100) // num of candidates to preselect
        ))
        .limit(10)
).await?;
```
