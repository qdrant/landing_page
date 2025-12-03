use qdrant_client::qdrant::{start_from::Value, Direction, OrderByBuilder};

pub async fn main() -> anyhow::Result<()> {
    OrderByBuilder::new("timestamp")
        .direction(Direction::Desc.into())
        .start_from(Value::Integer(123))
        .build();

    Ok(())
}
