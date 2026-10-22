```java
import static io.qdrant.client.QueryFactory.fusion;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.Fusion;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.Query;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.ScoredPoint;
import io.qdrant.client.grpc.Points.TextQuery;
import java.util.List;

PrefetchQuery densePrefetch =
    PrefetchQuery.newBuilder()
        .setQuery(
            nearest(Document.newBuilder().setText(queryText).setModel(denseModel).build()))
        .setUsing("dense_vector")
        .setLimit(5)
        .build();

PrefetchQuery bm25Prefetch =
    PrefetchQuery.newBuilder()
        .setQuery(
            Query.newBuilder()
                .setText(TextQuery.newBuilder().setQuery(queryText).build())
                .build())
        .setUsing("passage_text")
        .setLimit(5)
        .build();

QueryPoints request =
    QueryPoints.newBuilder()
        .setCollectionName("{collection_name}")
        .addPrefetch(densePrefetch)
        .addPrefetch(bm25Prefetch)
        .setQuery(fusion(Fusion.RRF))
        .setLimit(5)
        .setWithPayload(enable(true))
        .build();

List<ScoredPoint> results = client.queryAsync(request).get();
for (ScoredPoint point : results) {
    String question = point.getPayloadMap().get("question").getStringValue();
    System.out.printf("%.3f  %s%n", point.getScore(), question.strip());
}
```
