```java
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points;

    client
        .queryAsync(
            Points.QueryPoints.newBuilder()
                .setCollectionName("{collection_name}")
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setModel("<the-model-to-use>")
                            .setText("My Query Text")
                            .build()))
                .build())
        .get();
```
