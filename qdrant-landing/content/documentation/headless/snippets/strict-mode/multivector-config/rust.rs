use std::collections::HashMap;

use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, StrictModeConfigBuilder, StrictModeMultivector,
    StrictModeMultivectorConfig,
};

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client
        .create_collection(
            CreateCollectionBuilder::new("{collection_name}").strict_mode_config(
                StrictModeConfigBuilder::default()
                    .enabled(true)
                    .multivector_config(StrictModeMultivectorConfig {
                        multivector_config: HashMap::from([(
                            "{vector_name}".to_string(),
                            StrictModeMultivector {
                                max_vectors: Some(10),
                            },
                        )]),
                    }),
            ),
        )
        .await?;

    Ok(())
}
