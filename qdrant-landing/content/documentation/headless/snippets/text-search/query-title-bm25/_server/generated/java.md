```java
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Query;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.TextQuery;

QdrantClient client =

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("books")
            .setQuery(
                Query.newBuilder()
                    .setText(TextQuery.newBuilder().setQuery("time travel").build())
                    .build())
            .setUsing("title")
            .setLimit(10)
            .setWithPayload(enable(true))
            .build())
    .get();
```
