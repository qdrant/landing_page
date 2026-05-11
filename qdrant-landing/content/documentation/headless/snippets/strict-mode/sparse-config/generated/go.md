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
    SparseConfig: &qdrant.StrictModeSparseConfig{
      SparseConfig: map[string]*qdrant.StrictModeSparse{
        "{vector_name}": {MaxLength: qdrant.PtrOf(uint64(1000))},
      },
    },
  },
})
```
