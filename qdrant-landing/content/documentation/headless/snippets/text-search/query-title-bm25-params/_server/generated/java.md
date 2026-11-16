```java
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Bm25Params;
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
                    .setText(
                        TextQuery.newBuilder()
                            .setQuery("time travel")
                            .setBm25(Bm25Params.newBuilder().setK(1.5f).setB(0.5f).build())
                            .build())
                    .build())
            .setUsing("title")
            .setLimit(10)
            .setWithPayload(enable(true))
            .build())
    .get();
```
