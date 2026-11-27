```java
import static io.qdrant.client.QueryFactory.text;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.ScoredPoint;
import java.util.List;

List<ScoredPoint> results =
    client
        .queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName("menu")
                .setQuery(text("tahini"))
                .setUsing("description")
                .setLimit(3)
                .setWithPayload(enable(true))
                .build())
        .get();

for (ScoredPoint hit : results) {
    System.out.println(hit.getPayloadMap().get("name").getStringValue() + " " + hit.getScore());
}
```
