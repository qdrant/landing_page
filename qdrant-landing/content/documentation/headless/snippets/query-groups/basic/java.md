```java
import java.util.List;

import io.qdrant.client.grpc.Points.SearchPointGroups;

client.queryGroupsAsync(
        QueryPointGroups.newBuilder()
                .setCollectionName("{collection_name}")
                .setQuery(nearest(0.2f, 0.1f, 0.9f, 0.7f))
                .setGroupBy("document_id")
                .setLimit(4)
                .setGroupSize(2)
                .build())
        .get();
```
