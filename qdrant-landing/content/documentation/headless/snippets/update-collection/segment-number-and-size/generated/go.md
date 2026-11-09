```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
	CollectionName: "{collection_name}",
	OptimizersConfig: &qdrant.OptimizersConfigDiff{
		DefaultSegmentNumber: qdrant.PtrOf(uint64(4)),
		MaxSegmentSize:       qdrant.PtrOf(uint64(1000000)),
	},
})
```
