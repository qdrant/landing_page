use qdrant_client::qdrant::{
    DeletePointVectorsBuilder, PointsIdsList,
};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .delete_vectors(
            DeletePointVectorsBuilder::new("{collection_name}")
                .points_selector(PointsIdsList {
                    ids: vec![0.into(), 3.into(), 10.into()],
                })
                .vectors(vec!["text".into(), "image".into()])
                .wait(true),
        )
        .await?;

    Ok(())
}
