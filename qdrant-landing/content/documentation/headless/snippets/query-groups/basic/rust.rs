use qdrant_client::qdrant::QueryPointGroupsBuilder;

pub async fn main() -> anyhow::Result<()> {
    client
        .query_groups(
            QueryPointGroupsBuilder::new("{collection_name}", "document_id")
                .query(vec![0.2, 0.1, 0.9, 0.7])
                .group_size(2u64)
                .with_payload(true)
                .with_vectors(true)
                .limit(4u64),
        )
        .await?;

    Ok(())
}
