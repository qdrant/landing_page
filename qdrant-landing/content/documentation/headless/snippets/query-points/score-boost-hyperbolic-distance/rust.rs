use qdrant_client::qdrant::{
    Expression, FormulaBuilder, PrefetchQueryBuilder, QueryPointsBuilder,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    let _geodesic = client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .add_prefetch(
                    PrefetchQueryBuilder::default()
                        // the sign of the first element is flipped
                        .query(vec![-1.118, 0.3, 0.4])
                        .limit(100u64),
                )
                .query(FormulaBuilder::new(Expression::neg(Expression::acosh(
                    Expression::neg(Expression::score()),
                ))))
                .limit(10),
        )
        .await?;

    Ok(())
}
