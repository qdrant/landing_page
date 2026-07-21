```java
static void runSync() throws Exception {
    Map<String, Long> run = sync(LATEST_CHUNKS);
    System.out.println(run);
}
```
