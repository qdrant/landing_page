```java
client
    .countAsync(
        COLLECTION,
        Filter.newBuilder().addMustNot(hasVector(NEW_VECTOR)).build(),
        true)
    .get();
```
