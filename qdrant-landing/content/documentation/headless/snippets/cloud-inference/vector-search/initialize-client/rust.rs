use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Document};
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("https://xyz-example.qdrant.io:6334")
        .api_key("<paste-your-api-key-here>")
        .build()
        .unwrap();

    Ok(())
}
