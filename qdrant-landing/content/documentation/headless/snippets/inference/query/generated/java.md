```java
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points;

QdrantClient client =
    new QdrantClient(
        QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
            .withApiKey("<your-api-key")
            .build());
client
    .queryAsync(
        Points.QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setQuery(
                nearest(
                    Document.newBuilder()
                        .setModel("qdrant/bm25")
                        .setText("How to bake cookies?")
                        .build()))
            .setUsing("my-bm25-vector")
            .build())
    .get();
```
