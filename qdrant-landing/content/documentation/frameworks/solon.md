---
title: Solon
---

# Solon

[Solon](https://solon.noear.org) is a lightweight, high-performance Java enterprise framework designed for efficient, eco-friendly development. It enhances concurrency, reduces memory usage, speeds up startup, minimizes packaging size, and supports Java 8 to Java 23, offering a flexible alternative to Spring.

Qdrant is available as a component in Solon-AI for efficient vector indexing and retrievals.

## Installation

```xml
<dependency>
    <groupId>org.noear</groupId>
    <artifactId>solon-ai-repo-qdrant</artifactId>
</dependency>
```

This is the main extension plugin for **solon-ai**, which provides the `QdrantRepository` knowledge base.

## Configuration

When using `QdrantRepository`, an embedding model needs to be configured.

```yaml
solon.ai.embed:
  bgem3:
    apiUrl: "http://127.0.0.1:11434/api/embed"
    provider: "ollama"
    model: "bge-m3:latest"
    
solon.ai.repo:
  qdrant:
    host: "localhost"
    port: 6334
    useSsl: false
```

You can now instantiate the embedding model and Qdrant.

```java
@Configuration
public class DemoConfig {
    
    // Create the embedding model
    @Bean
    public EmbeddingModel embeddingModel(@Inject("${solon.ai.embed.bgem3}") EmbeddingConfig config) {
        return EmbeddingModel.of(config).build();
    }
    
    // Configure the QdrantClient using QdrantGrpcClient
    @BindProps(prefix = "solon.ai.repo.qdrant")
    @Bean
    public QdrantClient qdrantClient(@Value("${solon.ai.repo.qdrant.host}") String host, 
                                     @Value("${solon.ai.repo.qdrant.port}") int port, 
                                     @Value("${solon.ai.repo.qdrant.useSsl}") boolean useSsl) {
        return new QdrantClient(
                QdrantGrpcClient.newBuilder(host, port, useSsl).build()
        );
    }
    
    // Initialize the Qdrant knowledge base
    @Bean
    public QdrantRepository repository(EmbeddingModel embeddingModel, QdrantClient client) {
        return new QdrantRepository(embeddingModel, client);
    }
}
```

## Usage

```java
@Component
public class DemoService {
    @Inject
    private QdrantRepository repository;
    
    // Add documents to the repository
    public void addDocument(List<Document> docs) {
        repository.insert(docs);
    }
    
    // Search for documents based on a query
    public List<Document> findDocument(String query) {
        return repository.search(query);
    }
}
```

## Next steps

- Solon [Documentation](https://solon.noear.org).
- Solon [Source](https://github.com/opensolon/solon)
