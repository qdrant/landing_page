```go
import (
  "context"

  "github.com/qdrant/go-client/qdrant"
)

client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
  CollectionName: "{collection_name}",
  StrictModeConfig: &qdrant.StrictModeConfig{
    Enabled: qdrant.PtrOf(true),
    UnindexedFilteringRetrieve: qdrant.PtrOf(true),
  },
})
```
