// @block-start create-storage-directory
pub async fn main() -> anyhow::Result<()> {

    const SHARD_DIRECTORY: &str = "./qdrant-edge-directory";

    fs_err::create_dir_all(SHARD_DIRECTORY)?;
    // @block-end create-storage-directory

    // @block-start configure-edge-shard
    use qdrant_edge::*;

    const VECTOR_NAME: &str = "my-vector";
    const VECTOR_DIMENSION: usize = 4;

    let config = EdgeConfigBuilder::new()
        .on_disk_payload(true)
        .vector(
            VECTOR_NAME,
            EdgeVectorParamsBuilder::new(VECTOR_DIMENSION, Distance::Cosine)
                .on_disk(true)
                .build(),
        )
        .build();
    // @block-end configure-edge-shard

    // @block-start initialize-edge-shard
    use std::path::*;
    use qdrant_edge::*;

    let edge_shard = EdgeShard::new(
        Path::new(SHARD_DIRECTORY),
        config,
    )?;
    // @block-end initialize-edge-shard

    // @block-start upsert-points
    use serde_json::json;
    use qdrant_edge::*;

    let points: Vec<PointStructPersisted> = vec![
        PointStruct::new(
            1u64,
            Vectors::new_named([(VECTOR_NAME, vec![0.1f32, 0.2, 0.3, 0.4])]),
            json!({"color": "red"}),
        )
        .into(),
    ];

    edge_shard.update(UpdateOperation::PointOperation(
        PointOperations::UpsertPoints(
            PointInsertOperations::PointsList(points),
        ),
    ))?;
    // @block-end upsert-points

    // @block-start retrieve-point
    use qdrant_edge::*;

    let retrieved = edge_shard.retrieve(
        &[PointId::NumId(1)],
        Some(WithPayloadInterface::Bool(true)),
        Some(WithVector::Bool(false)),
    )?;
    // @block-end retrieve-point

    // @block-start modify-vector-schema
    use qdrant_edge::*;

    edge_shard.update(UpdateOperation::VectorNameOperation(
        VectorNameOperations::CreateVectorName(CreateVectorName {
            vector_name: "text".to_string(),
            config: VectorNameConfig::sparse(SparseVectorConfig {
                modifier: Some(Modifier::Idf),
                datatype: None,
            }),
        }),
    ))?;
    // @block-end modify-vector-schema

    // @block-start query-points
    use qdrant_edge::*;

    let results = edge_shard.query(QueryRequest {
        prefetches: vec![],
        query: Some(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
            query: vec![0.2f32, 0.1, 0.9, 0.7].into(),
            using: Some(VECTOR_NAME.to_string()),
        }))),
        filter: None,
        score_threshold: None,
        limit: 10,
        offset: 0,
        params: None,
        with_vector: WithVector::Bool(false),
        with_payload: WithPayloadInterface::Bool(true),
    })?;
    // @block-end query-points

    // @block-start filter
    use qdrant_edge::*;

    let filter = Filter {
        should: None,
        min_should: None,
        must: Some(vec![Condition::Field(FieldCondition::new_match(
            "color".try_into().unwrap(),
            Match::Value(MatchValue {
                value: ValueVariants::String("red".to_string()),
            }),
        ))]),
        must_not: None,
    };

    let results = edge_shard.query(QueryRequest {
        prefetches: vec![],
        query: Some(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
            query: vec![0.2f32, 0.1, 0.9, 0.7].into(),
            using: Some(VECTOR_NAME.to_string()),
        }))),
        filter: Some(filter),
        score_threshold: None,
        limit: 10,
        offset: 0,
        params: None,
        with_vector: WithVector::Bool(false),
        with_payload: WithPayloadInterface::Bool(true),
    })?;
    // @block-end filter

    // @block-start facet
    use qdrant_edge::*;

    let facet_response = edge_shard.facet(FacetRequest {
        key: "color".try_into().unwrap(),
        limit: 10,
        filter: None,
        exact: false,
    })?;
    // @block-end facet

    // @block-start optimize
    edge_shard.optimize()?;
    // @block-end optimize

    // @block-start configure-optimizer
    use qdrant_edge::*;

    let config = EdgeConfigBuilder::new()
        .on_disk_payload(true)
        .vector(
            VECTOR_NAME,
            EdgeVectorParamsBuilder::new(VECTOR_DIMENSION, Distance::Cosine)
                .on_disk(true)
                .build(),
        )
        .optimizers(EdgeOptimizersConfig {
            deleted_threshold: Some(0.2),
            vacuum_min_vector_number: Some(100),
            default_segment_number: Some(2),
            ..Default::default()
        })
        .build();
    // @block-end configure-optimizer

    // @block-start create-payload-index
    use qdrant_edge::*;

    edge_shard.update(UpdateOperation::FieldIndexOperation(
        FieldIndexOperations::CreateIndex(CreateIndex {
            field_name: "color".try_into().unwrap(),
            field_schema: Some(PayloadFieldSchema::FieldType(
                PayloadSchemaType::Keyword,
            )),
        }),
    ))?;
    // @block-end create-payload-index

    // @block-start close-edge-shard
    drop(edge_shard);
    // @block-end close-edge-shard

    // @block-start load-edge-shard
    use std::path::*;
    use qdrant_edge::*;

    let edge_shard = EdgeShard::load(Path::new(SHARD_DIRECTORY), None)?;
    // @block-end load-edge-shard

    // @block-start wal-options
    use std::path::*;
    use qdrant_edge::*;

    let config = EdgeConfigBuilder::new()
        .wal_options(WalOptions {
            segment_capacity: 4 * 1024 * 1024,
            ..Default::default()
        })
        .build();

    let edge_shard = EdgeShard::load(Path::new(SHARD_DIRECTORY), Some(config))?;
    // @block-end wal-options

    Ok(())
}
