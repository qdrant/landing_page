// @block-start configure-bm25-shard
pub async fn main() -> anyhow::Result<()> {
    const SHARD_DIRECTORY: &str = "./qdrant-edge-bm25";

    use std::path::*;
    use qdrant_edge::*;

    let config = EdgeConfigBuilder::new()
        .vector("embedding", EdgeVectorParamsBuilder::new(4, Distance::Cosine).build())
        .build();

    let shard = EdgeShard::new(Path::new(SHARD_DIRECTORY), config)?;
    // @block-end configure-bm25-shard

    // @block-start create-bm25-index
    use qdrant_edge::*;

    shard.update(UpdateOperation::FieldIndexOperation(
        FieldIndexOperations::CreateIndex(CreateIndex {
            field_name: "title".try_into().unwrap(),
            field_schema: Some(PayloadFieldSchema::FieldParams(PayloadSchemaParams::Text(
                TextIndexParamsBuilder::new()
                    .scoring(TextScoringParams::default())
                    .stemmer(StemmingAlgorithm::Snowball(SnowballParams {
                        r#type: Snowball::Snowball,
                        language: SnowballLanguage::English,
                    }))
                    .stopwords(StopwordsInterface::Language(Language::English))
                    .build(),
            ))),
        }),
    ))?;
    // @block-end create-bm25-index

    // @block-start upsert-points
    use qdrant_edge::external::serde_json::json;
    use qdrant_edge::*;

    let books: [(u64, [f32; 4], &str); 3] = [
        (1, [0.05, 0.61, 0.76, 0.74], "The Time Machine"),
        (2, [0.19, 0.81, 0.75, 0.11], "Time Travel in Einstein's Universe"),
        (3, [0.36, 0.55, 0.47, 0.94], "The Travels of Marco Polo"),
    ];

    let points = books
        .iter()
        .map(|(id, embedding, title)| {
            PointStruct::new(
                *id,
                Vectors::new_named([("embedding", embedding.to_vec())]),
                json!({ "title": title }),
            )
            .into()
        })
        .collect();

    shard.update(UpdateOperation::PointOperation(
        PointOperations::UpsertPoints(PointInsertOperations::PointsList(points)),
    ))?;
    // @block-end upsert-points

    // @block-start query-bm25
    use qdrant_edge::*;

    let results = shard.query(
        QueryRequestBuilder::new(3)
            .query(TextQueryBuilder::new("title".try_into().unwrap(), "time travel").build())
            .with_payload(WithPayloadInterface::Bool(true))
            .build(),
    )?;
    // @block-end query-bm25

    // @block-start query-bm25-params
    use qdrant_edge::*;

    let results = shard.query(
        QueryRequestBuilder::new(3)
            .query(
                TextQueryBuilder::new("title".try_into().unwrap(), "time travel")
                    .scoring(TextQueryScoring::Bm25(
                        Bm25ParamsBuilder::new().k(1.5).b(0.5).build(),
                    ))
                    .build(),
            )
            .with_payload(WithPayloadInterface::Bool(true))
            .build(),
    )?;
    // @block-end query-bm25-params

    Ok(())
}
