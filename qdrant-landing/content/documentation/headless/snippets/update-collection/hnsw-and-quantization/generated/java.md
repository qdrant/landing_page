```java
import io.qdrant.client.grpc.Collections.HnswConfigDiff;
import io.qdrant.client.grpc.Collections.QuantizationConfigDiff;
import io.qdrant.client.grpc.Collections.QuantizationType;
import io.qdrant.client.grpc.Collections.ScalarQuantization;
import io.qdrant.client.grpc.Collections.UpdateCollection;
import io.qdrant.client.grpc.Collections.VectorParamsDiff;
import io.qdrant.client.grpc.Collections.VectorParamsDiffMap;
import io.qdrant.client.grpc.Collections.VectorsConfigDiff;

client
    .updateCollectionAsync(
        UpdateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setHnswConfig(HnswConfigDiff.newBuilder().setEfConstruct(123).build())
            .setVectorsConfig(
                VectorsConfigDiff.newBuilder()
                    .setParamsMap(
                        VectorParamsDiffMap.newBuilder()
                            .putMap(
                                "my_vector",
                                VectorParamsDiff.newBuilder()
                                    .setHnswConfig(
                                        HnswConfigDiff.newBuilder()
                                            .setM(3)
                                            .setEfConstruct(123)
                                            .build())
                                    .build())))
            .setQuantizationConfig(
                QuantizationConfigDiff.newBuilder()
                    .setScalar(
                        ScalarQuantization.newBuilder()
                            .setType(QuantizationType.Int8)
                            .setQuantile(0.8f)
                            .setAlwaysRam(true)
                            .build()))
            .build())
    .get();
```
