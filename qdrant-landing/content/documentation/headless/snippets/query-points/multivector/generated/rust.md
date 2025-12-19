```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{ QueryPointsBuilder, VectorInput };

let client = Qdrant::from_url("http://localhost:6334").build()?;

let res = client.query(
    QueryPointsBuilder::new("{collection_name}")
        .query(VectorInput::new_multi(
            vec![
                vec![-0.013,  0.020, -0.007, -0.111],
                vec![-0.030, -0.055,  0.001,  0.072],
                vec![-0.041,  0.014, -0.032, -0.062],
            ]
        ))
).await?;
```
