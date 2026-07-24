```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.Memory;
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.QuantizationConfig;
import io.qdrant.client.grpc.Collections.QuantizationType;
import io.qdrant.client.grpc.Collections.ScalarQuantization;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

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
            .setQuantizationConfig(
                QuantizationConfig.newBuilder()
                    .setScalar(
                        ScalarQuantization.newBuilder()
                            .setType(QuantizationType.Int8)
                            .setMemory(Memory.Pinned)
                            .build())
                    .build())
            .build())
    .get();
```
