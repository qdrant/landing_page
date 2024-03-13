---
title: TestContainers
weight: 2700
---

# TestContainers

[TestContainers](https://testcontainers.com/) is an open source framework for providing throwaway, lightweight instances of databases, message brokers, web browsers, or just about anything that can run in a Docker container.

Qdrant is available as a [TestContainers module](https://testcontainers.com/modules/qdrant/) in multiple languages facilitating the spawning of a Qdrant instance for end-to-end testing.

## Usage

```java
import org.testcontainers.qdrant.QdrantContainer;

QdrantContainer qdrantContainer = new QdrantContainer("qdrant/qdrant:v1.8.1");
```

```go
import (
    "github.com/testcontainers/testcontainers-go"
    "github.com/testcontainers/testcontainers-go/modules/qdrant"
)

qdrantContainer, err := qdrant.RunContainer(ctx, testcontainers.WithImage("qdrant/qdrant:v1.8.1"))
```

```typescript
import { QdrantContainer } from "@testcontainers/qdrant";

const qdrantContainer = await new QdrantContainer("qdrant/qdrant:v1.8.1").start();
```

```python
from testcontainers.qdrant import QdrantContainer

qdrant_container = QdrantContainer("qdrant/qdrant:v1.8.1").start()
```

The container modules

## Further reading

- [TestContainers Guides](https://testcontainers.com/guides/)
