use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let config = EdgeConfigBuilder::new()
        .vector(
            "my-vector",
            EdgeVectorParamsBuilder::new(1024, Distance::Cosine)
                .datatype(VectorStorageDatatype::Turbo8)
                .build(),
        )
        .build();

    let _edge_shard = EdgeShard::new(std::path::Path::new("./shard"), config)?;

    Ok(())
}
