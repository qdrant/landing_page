```rust
fn point(id: u64, vector: Vec<f32>, payload: Value) -> PointStructPersisted {
    let mut vectors = HashMap::new();
    vectors.insert(VECTOR_NAME.to_string(), VectorInternal::from(vector));
    PointStructPersisted {
        id: ExtendedPointId::NumId(id),
        vector: VectorStructInternal::Named(vectors).into(),
        payload: Some(json_to_payload(payload)),
    }
}

fn json_to_payload(value: Value) -> Payload {
    if let Value::Object(map) = value {
        let mut payload = Payload::default();
        for (k, v) in map {
            payload.0.insert(k, v);
        }
        payload
    } else {
        Payload::default()
    }
}

let points = vec![point(1, vec![0.1, 0.2, 0.3, 0.4], json!({"color": "red"}))];

edge_shard.update(PointOperation(UpsertPoints(PointsList(points))))?;
```
