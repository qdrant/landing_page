```java
import io.qdrant.client.grpc.Points.FacetCounts;

client
      .facetAsync(
          FacetCounts.newBuilder()
              .setCollectionName("{collection_name}")
              .setKey("foo")
              .setExact(true)
              .build())
      .get();
```
