---
title: Langchain4J
weight: 2100
---

# Langchain4J

[Langchain4J](https://github.com/langchain4j/langchain4j) is a community port of [Langchain](https://www.langchain.com/) for building context-aware AI applications in Java

You can use Qdrant as a vectorstore in Langchain4J through the [`langchain4j-qdrant`](https://central.sonatype.com/artifact/dev.langchain4j/langchain4j-qdrant) module.

## Setup

Add the `langchain4j-qdrant` to your project dependencies.

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-qdrant</artifactId>
    <version>VERSION</version>
</dependency>
```

## Usage

```java
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.qdrant.QdrantEmbeddingStore;

EmbeddingStore<TextSegment> embeddingStore =
    QdrantEmbeddingStore.builder()
        // Ensure the collection is configured with the appropriate dimensions
        // of the embedding model.
        // Reference https://qdrant.tech/documentation/concepts/collections/
        .collectionName("{collection_name}")
        .host("xyz-example.eu-central.aws.cloud.qdrant.io")
        // GRPC port of the Qdrant server
        .port(6334)
        .apiKey("<YOUR_API_KEY")
        .build();
```

`QdrantEmbeddingStore` supports all the semantic features of Langchain4J. 

## Further Reading

- You can refer to the [Langchain4J examples](https://github.com/langchain4j/langchain4j-examples/) to get started.
