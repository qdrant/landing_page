```java
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.*;
import java.util.*;

QdrantClient client =

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("books")
            .setQuery(
                nearest(
                    Document.newBuilder()
                        .setText("Mieville")
                        .setModel("qdrant/bm25")
                        .putOptions("stemmer", value(Map.of("type", value("none"))))
                        .putOptions("stopwords", value(Map.of()))
                        .putOptions("tokenizer", value("multilingual"))
                        .putOptions("ascii_folding", value(true))
                        .build()))
            .setUsing("author-bm25")
            .setLimit(10)
            .setWithPayload(enable(true))
            .build())
    .get();
```
