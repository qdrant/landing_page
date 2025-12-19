```java
client.deleteAliasAsync("production_collection").get();
client.createAliasAsync("production_collection", "example_collection").get();
```
