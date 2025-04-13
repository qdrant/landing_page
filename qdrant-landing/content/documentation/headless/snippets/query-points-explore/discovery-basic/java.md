```java
import java.util.List;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.ContextInput;
import io.qdrant.client.grpc.Points.ContextInputPair;
import io.qdrant.client.grpc.Points.DiscoverInput;
import io.qdrant.client.grpc.Points.QueryPoints;

import static io.qdrant.client.VectorInputFactory.vectorInput;
import static io.qdrant.client.QueryFactory.discover;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(QueryPoints.newBuilder()
        .setCollectionName("{collection_name}")
        .setQuery(discover(DiscoverInput.newBuilder()
                .setTarget(vectorInput(0.2f, 0.1f, 0.9f, 0.7f))
                .setContext(ContextInput.newBuilder()
                        .addAllPairs(List.of(
                                ContextInputPair.newBuilder()
                                        .setPositive(vectorInput(100))
                                        .setNegative(vectorInput(718))
                                        .build(),
                                ContextInputPair.newBuilder()
                                        .setPositive(vectorInput(200))
                                        .setNegative(vectorInput(300))
                                        .build()))
                        .build())
                .build()))
        .setLimit(10)
        .build()).get();
```
