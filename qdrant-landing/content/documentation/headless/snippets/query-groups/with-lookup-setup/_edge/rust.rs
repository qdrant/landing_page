// Each Edge shard holds a single collection, so create one shard for chunks and one for documents
use std::path::Path;

use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let chunks_shard = EdgeShard::new(
        Path::new("./chunks"),
        EdgeConfigBuilder::new()
            .vector(
                DEFAULT_VECTOR_NAME,
                EdgeVectorParamsBuilder::new(4, Distance::Cosine).build(),
            )
            .build(),
    )?;
    chunks_shard.update(UpdateOperation::FieldIndexOperation(
        FieldIndexOperations::CreateIndex(CreateIndex {
            field_name: "document_id".try_into().unwrap(),
            field_schema: Some(PayloadFieldSchema::FieldType(PayloadSchemaType::Integer)),
        }),
    ))?;

    let documents_shard = EdgeShard::new(
        Path::new("./documents"),
        EdgeConfigBuilder::new().build(), // no vectors, payload only
    )?;

    Ok(())
}
