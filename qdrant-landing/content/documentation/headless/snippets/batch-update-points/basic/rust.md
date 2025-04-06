```rust
use std::collections::HashMap;

use qdrant_client::qdrant::{
    points_update_operation::{
        ClearPayload, DeletePayload, DeletePoints, DeleteVectors, Operation, OverwritePayload,
        PointStructList, SetPayload, UpdateVectors,
    },
    PointStruct, PointVectors, PointsUpdateOperation, UpdateBatchPointsBuilder, VectorsSelector,
};
use qdrant_client::Payload;

client
    .update_points_batch(
        UpdateBatchPointsBuilder::new(
            "{collection_name}",
            vec![
                PointsUpdateOperation {
                    operation: Some(Operation::Upsert(PointStructList {
                        points: vec![PointStruct::new(
                            1,
                            vec![1.0, 2.0, 3.0, 4.0],
                            Payload::default(),
                        )],
                        ..Default::default()
                    })),
                },
                PointsUpdateOperation {
                    operation: Some(Operation::UpdateVectors(UpdateVectors {
                        points: vec![PointVectors {
                            id: Some(1.into()),
                            vectors: Some(vec![1.0, 2.0, 3.0, 4.0].into()),
                        }],
                        ..Default::default()
                    })),
                },
                PointsUpdateOperation {
                    operation: Some(Operation::DeleteVectors(DeleteVectors {
                        points_selector: Some(vec![1.into()].into()),
                        vectors: Some(VectorsSelector {
                            names: vec!["".into()],
                        }),
                        ..Default::default()
                    })),
                },
                PointsUpdateOperation {
                    operation: Some(Operation::OverwritePayload(OverwritePayload {
                        points_selector: Some(vec![1.into()].into()),
                        payload: HashMap::from([("test_payload".to_string(), 1.into())]),
                        ..Default::default()
                    })),
                },
                PointsUpdateOperation {
                    operation: Some(Operation::SetPayload(SetPayload {
                        points_selector: Some(vec![1.into()].into()),
                        payload: HashMap::from([
                            ("test_payload_2".to_string(), 2.into()),
                            ("test_payload_3".to_string(), 3.into()),
                        ]),
                        ..Default::default()
                    })),
                },
                PointsUpdateOperation {
                    operation: Some(Operation::DeletePayload(DeletePayload {
                        points_selector: Some(vec![1.into()].into()),
                        keys: vec!["test_payload_2".to_string()],
                        ..Default::default()
                    })),
                },
                PointsUpdateOperation {
                    operation: Some(Operation::ClearPayload(ClearPayload {
                        points: Some(vec![1.into()].into()),
                        ..Default::default()
                    })),
                },
                PointsUpdateOperation {
                    operation: Some(Operation::DeletePoints(DeletePoints {
                        points: Some(vec![1.into()].into()),
                        ..Default::default()
                    })),
                },
            ],
        )
        .wait(true),
    )
    .await?;
```
