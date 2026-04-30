```rust
use std::collections::HashMap;

use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, StrictModeConfigBuilder, StrictModeSparse, StrictModeSparseConfig,
};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}").strict_mode_config(
            StrictModeConfigBuilder::default()
                .enabled(true)
                .sparse_config(StrictModeSparseConfig {
                    sparse_config: HashMap::from([(
                        "{vector_name}".to_string(),
                        StrictModeSparse {
                            max_length: Some(1000),
                        },
                    )]),
                }),
        ),
    )
    .await?;
```
