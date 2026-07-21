```java
static void createPayloadIndexes() throws Exception {
    for (String field : List.of("content_hash", "url", "section_url")) {
        client.createPayloadIndexAsync(
            COLLECTION, field, PayloadSchemaType.Keyword, null, null, null, null).get();
    }
}
```
