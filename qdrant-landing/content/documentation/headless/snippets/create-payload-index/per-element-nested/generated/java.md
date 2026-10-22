```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.FloatIndexParams;
import io.qdrant.client.grpc.Collections.KeywordIndexParams;
import io.qdrant.client.grpc.Collections.PayloadIndexParams;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;

client
    .createPayloadIndexAsync(
        "{collection_name}",
        "offers[].shop",
        PayloadSchemaType.Keyword,
        PayloadIndexParams.newBuilder()
            .setKeywordIndexParams(
                KeywordIndexParams.newBuilder().setNested("offers").build())
            .build(),
        null,
        null,
        null)
    .get();

client
    .createPayloadIndexAsync(
        "{collection_name}",
        "offers[].price",
        PayloadSchemaType.Float,
        PayloadIndexParams.newBuilder()
            .setFloatIndexParams(
                FloatIndexParams.newBuilder().setNested("offers").build())
            .build(),
        null,
        null,
        null)
    .get();
```
