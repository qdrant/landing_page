use qdrant_client::qdrant::{
    Expression, FormulaBuilder, PrefetchQueryBuilder, Query, QueryPointsBuilder,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let _best_fields = client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .add_prefetch(
                    PrefetchQueryBuilder::default()
                        .query(Query::new_text("vector database"))
                        .using("title")
                        .limit(50u64),
                )
                .add_prefetch(
                    PrefetchQueryBuilder::default()
                        .query(Query::new_text("vector database"))
                        .using("body")
                        .limit(50u64),
                )
                .query(FormulaBuilder::new(Expression::max_with([
                    // boost title matches
                    Expression::mult_with([
                        Expression::constant(3.0),
                        Expression::variable("$score[0]"),
                    ]),
                    Expression::variable("$score[1]"),
                ])))
                .limit(10),
        )
        .await?;

    Ok(())
}
