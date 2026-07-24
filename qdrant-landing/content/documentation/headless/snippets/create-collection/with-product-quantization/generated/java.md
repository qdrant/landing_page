```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CompressionRatio;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.Memory;
import io.qdrant.client.grpc.Collections.ProductQuantization;
import io.qdrant.client.grpc.Collections.QuantizationConfig;
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
                    .setProduct(
                        ProductQuantization.newBuilder()
                            .setCompression(CompressionRatio.x16)
                            .setMemory(Memory.Pinned)
                            .build())
                    .build())
            .build())
    .get();
```
