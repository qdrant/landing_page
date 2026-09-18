use qdrant_client::{
    Qdrant,
    qdrant::{Disabled, UpdateCollectionBuilder},
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client
        .update_collection(UpdateCollectionBuilder::new("test").quantization_config(Disabled {}))
        .await?;

    Ok(())
}
