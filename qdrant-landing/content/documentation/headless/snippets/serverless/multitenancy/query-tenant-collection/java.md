```java
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.ScoredPoint;
import java.util.List;

List<ScoredPoint> results =
    client
        .queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName("tenant-" + tenantId)
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setText("quarterly report")
                            .setModel("sentence-transformers/all-minilm-l6-v2")
                            .build()))
                .setLimit(10)
                .build())
        .get();
```
