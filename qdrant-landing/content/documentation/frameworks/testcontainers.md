---
title: Testcontainers
---

# Testcontainers

Qdrant is available as a [Testcontainers module](https://testcontainers.com/modules/qdrant/) in multiple languages. It  facilitates the spawning of a Qdrant instance for end-to-end testing.

As noted by [Testcontainers](https://testcontainers.com/), it "is an open source framework for providing throwaway, lightweight instances of databases, message brokers, web browsers, or just about anything that can run in a Docker container."

## Usage

```java
import org.testcontainers.qdrant.QdrantContainer;

QdrantContainer qdrantContainer = new QdrantContainer("qdrant/qdrant");
```

```go
import (
    "github.com/testcontainers/testcontainers-go"
    "github.com/testcontainers/testcontainers-go/modules/qdrant"
)

qdrantContainer, err := qdrant.RunContainer(ctx, testcontainers.WithImage("qdrant/qdrant"))
```

```typescript
import { QdrantContainer } from "@testcontainers/qdrant";

const qdrantContainer = await new QdrantContainer("qdrant/qdrant").start();
```

```python
from testcontainers.qdrant import QdrantContainer

qdrant_container = QdrantContainer("qdrant/qdrant").start()
```

Testcontainers modules provide options/methods to configure ENVs, volumes, and virtually everything you can configure in a Docker container.

## Further reading

- [Testcontainers Guides](https://testcontainers.com/guides/)
- [Testcontainers Qdrant Module](https://testcontainers.com/modules/qdrant/)
