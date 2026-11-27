```java
import static io.qdrant.client.ServerlessPayloadIndexFactory.floatIndex;
import static io.qdrant.client.ServerlessPayloadIndexFactory.keyword;

import io.qdrant.client.grpc.serverless.ServerlessCollections.CollectionConfig;
import io.qdrant.client.grpc.serverless.ServerlessCollections.DenseVectorConfig;
import io.qdrant.client.grpc.serverless.ServerlessCollections.Distance;
import io.qdrant.client.grpc.serverless.ServerlessCollections.PrecisionTier;
import io.qdrant.client.grpc.serverless.ServerlessCollections.SparseVectorConfig;

client
    .createCollectionAsync(
        "products",
        CollectionConfig.newBuilder()
            .putDenseVectors(
                "dense",
                DenseVectorConfig.newBuilder()
                    .setSize(1536)
                    .setDistance(Distance.COSINE)
                    .setPrecisionTier(PrecisionTier.MEDIUM)
                    .build())
            .putSparseVectors("bm25", SparseVectorConfig.newBuilder().setUseIdf(true).build())
            .putPayloadIndexes("category", keyword())
            .putPayloadIndexes("price", floatIndex())
            .build())
    .get();
```
