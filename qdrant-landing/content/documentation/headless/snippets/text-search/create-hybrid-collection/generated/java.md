```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.*;

QdrantClient client =

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("books")
            .setVectorsConfig(
                VectorsConfig.newBuilder()
                    .setParamsMap(
                        VectorParamsMap.newBuilder()
                            .putMap(
                                "description-dense",
                                VectorParams.newBuilder()
                                    .setSize(384)
                                    .setDistance(Distance.Cosine)
                                    .build())
                            .build())
                    .build())
            .setSparseVectorsConfig(
                SparseVectorConfig.newBuilder()
                    .putMap(
                        "isbn-bm25",
                        SparseVectorParams.newBuilder().setModifier(Modifier.Idf).build())
                    .build())
            .build())
    .get();
```
