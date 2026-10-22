```java
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.*;

QdrantClient client =

PrefetchQuery densePrefetch =
    PrefetchQuery.newBuilder()
        .setUsing("description-dense")
        .setScoreThreshold(0.5f)
        .setQuery(
            nearest(
                Document.newBuilder()
                    .setText("time travel")
                    .setModel("sentence-transformers/all-minilm-l6-v2")
                    .build()))
        .build();

PrefetchQuery bm25Prefetch =
    PrefetchQuery.newBuilder()
        .setUsing("title")
        .setQuery(
            Query.newBuilder()
                .setText(TextQuery.newBuilder().setQuery("time travel").build())
                .build())
        .build();

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("books")
            .addPrefetch(densePrefetch)
            .addPrefetch(bm25Prefetch)
            .setQuery(Query.newBuilder().setFusion(Fusion.RRF).build())
            .setLimit(10)
            .setWithPayload(enable(true))
            .build())
    .get();
```
