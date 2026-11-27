```java
import static io.qdrant.client.ServerlessPayloadIndexFactory.text;

import io.qdrant.client.grpc.serverless.ServerlessCollections.CollectionConfig;
import io.qdrant.client.grpc.serverless.ServerlessCollections.DenseVectorConfig;
import io.qdrant.client.grpc.serverless.ServerlessCollections.Distance;
import io.qdrant.client.grpc.serverless.ServerlessCollections.StopwordsSet;
import io.qdrant.client.grpc.serverless.ServerlessCollections.TextIndex;
import io.qdrant.client.grpc.serverless.ServerlessCollections.TextScoringParams;
import io.qdrant.client.grpc.serverless.ServerlessCollections.TextScoringType;
import io.qdrant.client.grpc.serverless.ServerlessCollections.Tokenizer;

client
    .createCollectionAsync(
        "menu",
        CollectionConfig.newBuilder()
            .putDenseVectors(
                "dense",
                DenseVectorConfig.newBuilder().setSize(384).setDistance(Distance.COSINE).build())
            .putPayloadIndexes(
                "description",
                text(
                    TextIndex.newBuilder()
                        .setTokenizer(Tokenizer.WORD)
                        .setStopwords(StopwordsSet.newBuilder().addLanguages("english"))
                        .setScoring(TextScoringParams.newBuilder().setType(TextScoringType.BM25))
                        .build()))
            .build())
    .get();
```
