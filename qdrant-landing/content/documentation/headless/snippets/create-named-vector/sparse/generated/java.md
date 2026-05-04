```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Modifier;
import io.qdrant.client.grpc.Points.CreateVectorNameRequest;
import io.qdrant.client.grpc.Points.SparseVectorCreationConfig;

client
    .createVectorNameAsync(
        CreateVectorNameRequest.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorName("{vector_name}")
            .setSparseConfig(
                SparseVectorCreationConfig.newBuilder()
                    .setModifier(Modifier.Idf)
                    .build())
            .build())
    .get();
```
