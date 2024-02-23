---
title: Spring AI
weight: 2200
---

# Spring AI

[Spring AI](https://docs.spring.io/spring-ai/reference/) is a Java framework that provides a [Spring-friendly](https://spring.io/) API and abstractions for developing AI applications.

Qdrant is available as supported vector database for use within your Spring AI projects.

## Installation

To acquire Spring AI artifacts, declare the Spring Snapshot repository in your `pom.xml`.

```xml
<repository>
   <id>spring-snapshots</id>
   <name>Spring Snapshots</name>
   <url>https://repo.spring.io/snapshot</url>
   <releases>
      <enabled>false</enabled>
   </releases>
</repository>
```

Add the `spring-ai-qdrant` package.

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-qdrant</artifactId>
    <version>VERSION</version>
</dependency>
```

## Usage

You can set up the Qdrant vector store with the `QdrantVectorStoreConfig` options.

```java
@Bean
public QdrantVectorStoreConfig qdrantVectorStoreConfig() {

    return QdrantVectorStoreConfig.builder()
        .withHost("<QDRANT_HOSTNAME>")
        .withPort(<QDRANT_GRPC_PORT>)
        .withCollectionName("<QDRANT_COLLECTION_NAME>")
        .withApiKey("<QDRANT_API_KEY>")
        .build();
}
```

<aside role="status">You'll need to <a href="/documentation/concepts/collections/#create-a-collection">create a collection</a> with the appropriate vector dimensions and configurations in advance.</aside>

Build the vector store using the config and any of the support [Spring AI embedding providers](https://docs.spring.io/spring-ai/reference/api/embeddings.html#available-implementations).

```java
@Bean
public VectorStore vectorStore(QdrantVectorStoreConfig config, EmbeddingClient embeddingClient) {
    return new QdrantVectorStore(config, embeddingClient);
}
```

You can now use the `VectorStore` instance backed by Qdrant as a vector store in the Spring AI APIs.

## Further Reading

- 📚 Spring AI [reference](https://docs.spring.io/spring-ai/reference/index.html)
