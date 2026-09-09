use qdrant_client::qdrant::{
    PointStruct, UpsertPointsBuilder, WriteOrdering, WriteOrderingType,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    let client = Qdrant::from_url("http://localhost:6334").build()?;
    // @hide-end

    client
        .upsert_points(
            UpsertPointsBuilder::new(
                "{collection_name}",
                vec![
                    PointStruct::new(1, vec![0.9, 0.1, 0.1], [("color", "red".into())]),
                    PointStruct::new(2, vec![0.1, 0.9, 0.1], [("color", "green".into())]),
                    PointStruct::new(3, vec![0.1, 0.1, 0.9], [("color", "blue".into())]),
                ],
            )
            .ordering(WriteOrdering {
                r#type: WriteOrderingType::Strong.into(),
            }),
        )
        .await?;

    Ok(())
}
