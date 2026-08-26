```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Datatype;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.HnswConfigDiff;
import io.qdrant.client.grpc.Collections.Memory;
import io.qdrant.client.grpc.Collections.QuantizationConfig;
import io.qdrant.client.grpc.Collections.TurboQuantBitSize;
import io.qdrant.client.grpc.Collections.TurboQuantization;
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
                            .setMemory(Memory.Cold)
                            .setDatatype(Datatype.Turbo4)
                            .build())
                    .build())
            .setQuantizationConfig(
                QuantizationConfig.newBuilder()
                    .setTurboquant(
                        TurboQuantization.newBuilder().
                        setMemory(Memory.Cold).
                        setBits(TurboQuantBitSize.Bits1)
                        .build())
                    .build())
            .setHnswConfig(HnswConfigDiff.newBuilder().setMemory(Memory.Cold).setInlineStorage(true).build())
            .build())
    .get();
```
