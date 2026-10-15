```java
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.PayloadIndexParams;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;
import io.qdrant.client.grpc.Collections.TextIndexParams;
import io.qdrant.client.grpc.Collections.TextScoringParams;
import io.qdrant.client.grpc.Collections.TextScoringType;
import io.qdrant.client.grpc.Collections.TokenizerType;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorParamsMap;
import io.qdrant.client.grpc.Collections.VectorsConfig;
import java.util.Map;

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
                    .build())
            .build())
    .get();

client
    .createPayloadIndexAsync(
        "{collection_name}",
        "passage_text",
        PayloadSchemaType.Text,
        PayloadIndexParams.newBuilder()
            .setTextIndexParams(
                TextIndexParams.newBuilder()
                    .setTokenizer(TokenizerType.Word)
                    // Enable BM25 scoring
                    .setScoring(
                        TextScoringParams.newBuilder()
                            .setType(TextScoringType.Bm25)
                            .build())
                    .build())
            .build(),
        null,
        null,
        null)
    .get();
```
