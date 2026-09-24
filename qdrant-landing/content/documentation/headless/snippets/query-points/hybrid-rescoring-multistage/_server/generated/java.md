```java
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .addPrefetch(
                PrefetchQuery.newBuilder()
                    .addPrefetch(
                        PrefetchQuery.newBuilder()
                            .setQuery(nearest(1, 23, 45, 67))	// <------------- small byte vector
                            .setUsing("mrl_byte")
                            .setLimit(1000)
                            .build())
                    .setQuery(nearest(0.01f, 0.45f, 0.67f)) // <-- dense vector
                    .setUsing("full")
                    .setLimit(100)
                    .build())
            .setQuery(
                nearest(
                    new float[][] {
                      {0.1f, 0.2f},	// <─┐
                      {0.2f, 0.1f},	// < ├─ multi-vector
                      {0.8f, 0.9f}	// < ┘
                    }))
            .setUsing("colbert")
            .setLimit(10)
            .build())
    .get();
```
