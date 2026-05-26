use qdrant_client::qdrant::{
    CreateCollectionBuilder, DeletePointsBuilder, Distance, PointStruct, PointsIdsList,
    UpsertPointsBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    // @block-start upsert-no-auth
    let client = Qdrant::from_url("https://localhost:6334").build()?;

    let result = client
        .upsert_points(UpsertPointsBuilder::new(
            "my_collection",
            vec![PointStruct::new(1, vec![0.1_f32, 0.2, 0.3, 0.4], [("source", "tutorial".into())])],
        ))
        .await;
    if let Err(e) = result {
        println!("{}", e); // Unauthorized
    }
    // @block-end upsert-no-auth

    // @block-start upsert-admin-key
    let client = Qdrant::from_url("https://localhost:6334")
        .api_key("my-admin-key")
        .build()?;

    client
        .create_collection(
            CreateCollectionBuilder::new("my_collection")
                .vectors_config(VectorParamsBuilder::new(4, Distance::Cosine)),
        )
        .await?;

    client
        .upsert_points(UpsertPointsBuilder::new(
            "my_collection",
            vec![PointStruct::new(1, vec![0.1_f32, 0.2, 0.3, 0.4], [("source", "tutorial".into())])],
        ))
        .await?;
    // @block-end upsert-admin-key

    // @block-start delete-read-only-key
    let client = Qdrant::from_url("https://localhost:6334")
        .api_key("my-read-only-key")
        .build()?;

    let result = client
        .delete_points(
            DeletePointsBuilder::new("my_collection").points(PointsIdsList {
                ids: vec![1.into()],
            }),
        )
        .await;
    if let Err(e) = result {
        println!("{}", e); // PermissionDenied
    }
    // @block-end delete-read-only-key

    // @block-start upsert-jwt-rw-collection
    let client = Qdrant::from_url("https://localhost:6334")
        .api_key("<your-jwt>")
        .build()?;

    client
        .upsert_points(UpsertPointsBuilder::new(
            "my_collection",
            vec![PointStruct::new(2, vec![0.5_f32, 0.6, 0.7, 0.8], [("source", "tutorial".into())])],
        ))
        .await?;
    // @block-end upsert-jwt-rw-collection

    // @block-start upsert-jwt-ro-collection
    let client = Qdrant::from_url("https://localhost:6334")
        .api_key("<your-jwt>")
        .build()?;

    let result = client
        .upsert_points(UpsertPointsBuilder::new(
            "other_collection",
            vec![PointStruct::new(2, vec![0.5_f32, 0.6, 0.7, 0.8], [("source", "tutorial".into())])],
        ))
        .await;
    if let Err(e) = result {
        println!("{}", e); // PermissionDenied
    }
    // @block-end upsert-jwt-ro-collection

    Ok(())
}
