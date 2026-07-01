```go
import (
  "context"

  "github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
  Host: "localhost",
  Port: 6334,
})

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
  CollectionName: "{collection_name}",
  StrictModeConfig: &qdrant.StrictModeConfig{
    Enabled: qdrant.PtrOf(true),
    MultivectorConfig: &qdrant.StrictModeMultivectorConfig{
      MultivectorConfig: map[string]*qdrant.StrictModeMultivector{
        "{vector_name}": {MaxVectors: qdrant.PtrOf(uint64(10))},
      },
    },
  },
})
```
