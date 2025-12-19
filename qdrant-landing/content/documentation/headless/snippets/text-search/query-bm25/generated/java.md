```java
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;
import static io.qdrant.client.ConditionFactory.*;
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.namedVectors;
import static io.qdrant.client.VectorFactory.vector;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.*;
import io.qdrant.client.grpc.Points.*;
import java.util.*;

client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName("books")
        .setQuery(nearest(Document.newBuilder().setText("time travel").setModel("qdrant/bm25").build()))
        .setUsing("title-bm25")
        .setLimit(10)
        .setWithPayload(enable(true))
        .build()
).get();
```
