```java
import static io.qdrant.client.QueryFactory.nearest;
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

client.createCollectionAsync(
    CreateCollection.newBuilder()
        .setCollectionName("books")
        .setVectorsConfig(
            VectorsConfig.newBuilder()
                .setParamsMap(
                    VectorParamsMap.newBuilder()
                        .putMap(
                            "description-dense",
                            VectorParams.newBuilder().setSize(384).setDistance(Distance.Cosine).build())
                        .build())
                .build())
        .build())
    .get();
```
