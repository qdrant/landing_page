use qdrant_client::qdrant::{
    read_consistency::Value, Condition, Filter, QueryPointsBuilder, ReadConsistencyType,
    SearchParamsBuilder,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    let client = Qdrant::from_url("http://localhost:6334").build()?;
    // @hide-end

    client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .query(vec![0.2, 0.1, 0.9, 0.7])
                .limit(3)
                .filter(Filter::must([Condition::matches(
                    "city",
                    "London".to_string(),
                )]))
                .params(SearchParamsBuilder::default().hnsw_ef(128).exact(false))
                .read_consistency(Value::Type(ReadConsistencyType::Majority.into())),
        )
        .await?;

    Ok(())
}
