use qdrant_client::qdrant::{
    DeletePointVectorsBuilder, PointsIdsList,
};

pub async fn main() -> anyhow::Result<()> {
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
