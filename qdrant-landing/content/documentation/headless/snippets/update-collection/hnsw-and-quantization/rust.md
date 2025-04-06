```rust
use std::collections::HashMap;

use qdrant_client::qdrant::{
    quantization_config_diff::Quantization, vectors_config_diff::Config, HnswConfigDiffBuilder,
    QuantizationType, ScalarQuantizationBuilder, UpdateCollectionBuilder, VectorParamsDiffBuilder,
    VectorParamsDiffMap,
};

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}")
            .hnsw_config(HnswConfigDiffBuilder::default().ef_construct(123))
            .vectors_config(Config::ParamsMap(VectorParamsDiffMap {
                map: HashMap::from([(
                    ("my_vector".into()),
                    VectorParamsDiffBuilder::default()
                        .hnsw_config(HnswConfigDiffBuilder::default().m(32).ef_construct(123))
                        .build(),
                )]),
            }))
            .quantization_config(Quantization::Scalar(
                ScalarQuantizationBuilder::default()
                    .r#type(QuantizationType::Int8.into())
                    .quantile(0.8)
                    .always_ram(true)
                    .build(),
            )),
    )
    .await?;
```
