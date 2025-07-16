```rust
use qdrant_client::qdrant::{
    BinaryQuantizationBuilder, CreateCollectionBuilder, Distance, VectorParamsBuilder, BinaryQuantizationQueryEncoding, binary_quantization_query_encoding,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(1536, Distance::Cosine))
            .quantization_config(BinaryQuantizationBuilder::new(true).query_encoding(BinaryQuantizationQueryEncoding{
                variant: Some(binary_quantization_query_encoding::Variant::Setting(binary_quantization_query_encoding::Setting::Scalar8Bits.into()))
            })),
    )
    .await?;
```
