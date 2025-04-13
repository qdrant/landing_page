```java
import java.util.List;

import io.qdrant.client.grpc.Points.QueryPointGroups;
import io.qdrant.client.grpc.Points.WithLookup;

import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.WithVectorsSelectorFactory.enable;
import static io.qdrant.client.WithPayloadSelectorFactory.include;

client.queryGroupsAsync(
        QueryPointGroups.newBuilder()
                .setCollectionName("{collection_name}")
                .setQuery(nearest(0.2f, 0.1f, 0.9f, 0.7f))
                .setGroupBy("document_id")
                .setLimit(2)
                .setGroupSize(2)
                .setWithLookup(
                        WithLookup.newBuilder()
                                .setCollection("documents")
                                .setWithPayload(include(List.of("title", "text")))
                                .setWithVectors(enable(false))
                                .build())
                .build())
        .get();
```
