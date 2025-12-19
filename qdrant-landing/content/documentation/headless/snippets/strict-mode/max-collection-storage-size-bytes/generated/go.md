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
    MaxCollectionVectorSizeBytes: qdrant.PtrOf(uint64(1000000)),
    MaxCollectionPayloadSizeBytes: qdrant.PtrOf(uint64(1000000)),
  },
})
```
