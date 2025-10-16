```java
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.Modifier;
import io.qdrant.client.grpc.Collections.SparseVectorConfig;
import io.qdrant.client.grpc.Collections.SparseVectorParams;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorParamsMap;
import io.qdrant.client.grpc.Collections.VectorsConfig;

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorsConfig(
                VectorsConfig.newBuilder()
                    .setParamsMap(
                        VectorParamsMap.newBuilder()
                            .putAllMap(
                                Map.of(
                                    "dense_vector",
                                    VectorParams.newBuilder()
                                        .setSize(384)
                                        .setDistance(Distance.Cosine)
                                        .build())))
                    .setSparseVectorsConfig(
                        SparseVectorConfig.newBuilder()
                            .putMap(
                                "bm25_sparse_vector",
                                SparseVectorParams.newBuilder()
                                    .setModifier(Modifier.Idf)
                                    .build())))
            .build())
    .get();
```
