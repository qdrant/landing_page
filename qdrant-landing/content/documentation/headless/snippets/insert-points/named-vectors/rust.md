```rust

use qdrant_client::qdrant::{
    NamedVectors, PointStruct, UpsertPointsBuilder, Vector,
};
use qdrant_client::Payload;

client
    .upsert_points(
        UpsertPointsBuilder::new(
            "{collection_name}",
            vec![PointStruct::new(
                1,
                NamedVectors::default()
                    .add_vector("text", Vector::new_dense(vec![0.4, 0.7, 0.1, 0.8, 0.1]))
                    .add_vector("image", Vector::new_dense(vec![0.9, 0.1, 0.1, 0.2]))
                    .add_vector(
                        "text-sparse",
                        Vector::new_sparse(vec![1, 3, 5, 7], vec![0.1, 0.2, 0.3, 0.4]),
                    ),
                Payload::default(),
            )],
        )
        .wait(true),
    )
    .await?;
```
