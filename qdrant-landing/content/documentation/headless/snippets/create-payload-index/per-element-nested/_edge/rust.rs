use qdrant_edge::*;

pub async fn main() -> anyhow::Result<()> {
    let edge_shard = EdgeShard::load(std::path::Path::new("./shard"), None)?; // @hide

    edge_shard.update(UpdateOperation::FieldIndexOperation(
        FieldIndexOperations::CreateIndex(CreateIndex {
            field_name: "offers[].shop".try_into().unwrap(),
            field_schema: Some(PayloadFieldSchema::FieldParams(
                PayloadSchemaParams::Keyword(
                    KeywordIndexParamsBuilder::new()
                        .nested("offers".try_into().unwrap())
                        .build(),
                ),
            )),
        }),
    ))?;

    edge_shard.update(UpdateOperation::FieldIndexOperation(
        FieldIndexOperations::CreateIndex(CreateIndex {
            field_name: "offers[].price".try_into().unwrap(),
            field_schema: Some(PayloadFieldSchema::FieldParams(
                PayloadSchemaParams::Float(
                    FloatIndexParamsBuilder::new()
                        .nested("offers".try_into().unwrap())
                        .build(),
                ),
            )),
        }),
    ))?;

    Ok(())
}
