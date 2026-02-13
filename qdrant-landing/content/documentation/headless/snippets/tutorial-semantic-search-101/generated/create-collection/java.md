```java
String COLLECTION_NAME = "my_books";

client.createCollectionAsync(COLLECTION_NAME,
        VectorParams.newBuilder().setDistance(Distance.Cosine).setSize(384).build()).get();
```
