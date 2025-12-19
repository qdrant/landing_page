```java
import static io.qdrant.client.QueryFactory.context;
import static io.qdrant.client.VectorInputFactory.vectorInput;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.ContextInput;
import io.qdrant.client.grpc.Points.ContextInputPair;
import io.qdrant.client.grpc.Points.QueryPoints;
import java.util.List;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(QueryPoints.newBuilder()
        .setCollectionName("{collection_name}")
        .setQuery(context(ContextInput.newBuilder()
                .addAllPairs(List.of(
                        ContextInputPair.newBuilder()
                                .setPositive(vectorInput(100))
                                .setNegative(vectorInput(718))
                                .build(),
                        ContextInputPair.newBuilder()
                                .setPositive(vectorInput(200))
                                .setNegative(vectorInput(300))
                                .build()))
                .build()))
        .setLimit(10)
        .build()).get();
```
