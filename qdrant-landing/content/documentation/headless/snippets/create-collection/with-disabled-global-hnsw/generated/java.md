```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.HnswConfigDiff;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorsConfig(
                VectorsConfig.newBuilder()
                    .setParams(
                        VectorParams.newBuilder()
                            .setSize(768)
                            .setDistance(Distance.Cosine)
                            .build())
                    .build())
            .setHnswConfig(HnswConfigDiff.newBuilder().setPayloadM(16).setM(0).build())
            .build())
    .get();
```
