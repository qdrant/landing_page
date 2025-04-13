```rust
use qdrant_client::qdrant::{
    QuantizationSearchParamsBuilder, QueryPointsBuilder, SearchParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;
    
client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![0.2, 0.1, 0.9, 0.7])
            .limit(10)
            .params(
                SearchParamsBuilder::default().quantization(
                    QuantizationSearchParamsBuilder::default()
                        .ignore(false)
                        .rescore(true)
                        .oversampling(2.0),
                ),
            ),
    )
    .await?;
```
