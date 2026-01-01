```java
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.*;

QdrantClient client =

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("books")
            .setQuery(
                nearest(
                    Document.newBuilder()
                        .setText("time travel")
                        .setModel("prithivida/splade_pp_en_v1")
                        .build()))
            .setUsing("title-splade")
            .setLimit(10)
            .setWithPayload(enable(true))
            .build())
    .get();
```
