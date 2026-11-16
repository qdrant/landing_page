```java
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.Query;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.TextQuery;
import java.util.List;

QdrantClient client =

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .addPrefetch(
                PrefetchQuery.newBuilder()
                    .setQuery(
                        Query.newBuilder()
                            .setText(TextQuery.newBuilder().setQuery("time travel").build())
                            .build())
                    .setUsing("title")
                    .setLimit(100)
                    .build())
            .setQuery(nearest(List.of(0.01f, 0.45f, 0.67f)))
            .setUsing("dense")
            .setLimit(10)
            .build())
    .get();
```
