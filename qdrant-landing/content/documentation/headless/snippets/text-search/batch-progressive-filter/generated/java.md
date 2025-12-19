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
import io.qdrant.client.grpc.Common.Filter;

QueryPoints searchStrict = QueryPoints.newBuilder()
    .setCollectionName("books")
    .setQuery(nearest(Document.newBuilder().setText("time travel").setModel("sentence-transformers/all-minilm-l6-v2").build()))
    .setUsing("description-dense")
    .setFilter(Filter.newBuilder().addMust(matchText("title", "time travel")).build())
    .setWithPayload(enable(true))
    .build();

QueryPoints searchRelaxed = QueryPoints.newBuilder()
    .setCollectionName("books")
    .setQuery(nearest(Document.newBuilder().setText("time travel").setModel("sentence-transformers/all-minilm-l6-v2").build()))
    .setUsing("description-dense")
    .setFilter(Filter.newBuilder().addMust(matchTextAny("title", "time travel")).build())
    .setWithPayload(enable(true))
    .build();

QueryPoints searchVectorOnly = QueryPoints.newBuilder()
    .setCollectionName("books")
    .setQuery(nearest(Document.newBuilder().setText("time travel").setModel("sentence-transformers/all-minilm-l6-v2").build()))
    .setUsing("description-dense")
    .setWithPayload(enable(true))
    .build();

client.queryBatchAsync("books", List.of(searchStrict, searchRelaxed, searchVectorOnly)).get();
```
