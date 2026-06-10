```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
	CollectionName: "{collection_name}",
	HnswConfig: &qdrant.HnswConfigDiff{
		MaxIndexingThreads: qdrant.PtrOf(uint64(4)),
	},
})
```
