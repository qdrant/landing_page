use qdrant_client::qdrant::{
    Expression, FormulaBuilder, PrefetchQueryBuilder, QueryPointsBuilder,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    let _capped_boost = client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .add_prefetch(
                    PrefetchQueryBuilder::default()
                        .query(vec![0.01, 0.45, 0.67])
                        .limit(100u64),
                )
                .query(FormulaBuilder::new(Expression::sum_with([
                    Expression::score(),
                    Expression::min_with([
                        // the boost can't exceed this value
                        Expression::constant(2.0),
                        Expression::mult_with([
                            Expression::constant(0.1),
                            Expression::variable("log_views"),
                        ]),
                    ]),
                ])))
                .limit(10),
        )
        .await?;

    Ok(())
}
