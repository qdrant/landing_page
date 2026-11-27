```java
import static io.qdrant.client.QueryFactory.fusion;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.QueryFactory.text;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.Fusion;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.ScoredPoint;
import java.util.List;

String query = "a vegetarian dish with tahini";

List<ScoredPoint> results =
    client
        .queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName("menu")
                .addPrefetch(
                    PrefetchQuery.newBuilder()
                        .setQuery(
                            nearest(Document.newBuilder().setText(query).setModel(model).build()))
                        .setUsing("dense")
                        .setLimit(10)
                        .build())
                .addPrefetch(
                    PrefetchQuery.newBuilder()
                        .setQuery(text(query))
                        .setUsing("description")
                        .setLimit(10)
                        .build())
                .setQuery(fusion(Fusion.RRF))
                .setLimit(3)
                .setWithPayload(enable(true))
                .build())
        .get();

for (ScoredPoint hit : results) {
    System.out.println(hit.getPayloadMap().get("name").getStringValue() + " " + hit.getScore());
}
```
