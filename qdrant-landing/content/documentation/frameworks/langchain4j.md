---
title: Langchain4J
---

# LangChain for Java

LangChain for Java, also known as [Langchain4J](https://github.com/langchain4j/langchain4j), is a community port of [Langchain](https://www.langchain.com/) for building context-aware AI applications in Java

You can use Qdrant as a vector store in Langchain4J through the [`langchain4j-qdrant`](https://central.sonatype.com/artifact/dev.langchain4j/langchain4j-qdrant) module.

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

Before you use the following code sample, customize the following values for your configuration:

- `YOUR_COLLECTION_NAME`: Use our [Collections](/documentation/concepts/collections/) guide to create or
  list collections.
- `YOUR_HOST_URL`: Use the GRPC URL for your system. If you used the [Quick Start](/documentation/quick-start/) guide,
  it may be http://localhost:6334. If you've deployed in the [Qdrant Cloud](/documentation/cloud/), you may have a
  longer URL such as `https://example.location.cloud.qdrant.io:6334`.
- `YOUR_API_KEY`: Substitute the API key associated with your configuration.
```java
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.qdrant.QdrantEmbeddingStore;

EmbeddingStore<TextSegment> embeddingStore =
    QdrantEmbeddingStore.builder()
        // Ensure the collection is configured with the appropriate dimensions
        // of the embedding model.
        // Reference https://qdrant.tech/documentation/concepts/collections/
        .collectionName("YOUR_COLLECTION_NAME")
        .host("YOUR_HOST_URL")
        // GRPC port of the Qdrant server
        .port(6334)
        .apiKey("YOUR_API_KEY")
        .build();
```

`QdrantEmbeddingStore` supports all the semantic features of Langchain4J. 

## Further Reading

- You can refer to the [Langchain4J examples](https://github.com/langchain4j/langchain4j-examples/) to get started.
- [Source Code](https://github.com/langchain4j/langchain4j/tree/main/langchain4j-qdrant)
