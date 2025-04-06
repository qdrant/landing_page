```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.PayloadIndexParams;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;
import io.qdrant.client.grpc.Collections.TextIndexParams;
import io.qdrant.client.grpc.Collections.TokenizerType;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createPayloadIndexAsync(
        "{collection_name}",
        "name_of_the_field_to_index",
        PayloadSchemaType.Text,
        PayloadIndexParams.newBuilder()
            .setTextIndexParams(
                TextIndexParams.newBuilder()
                    .setTokenizer(TokenizerType.Word)
                    .setMinTokenLen(2)
                    .setMaxTokenLen(10)
                    .setLowercase(true)
                    .build())
            .build(),
        null,
        null,
        null)
    .get();
```
