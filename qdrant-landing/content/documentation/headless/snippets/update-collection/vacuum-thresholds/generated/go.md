```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
	CollectionName: "{collection_name}",
	OptimizersConfig: &qdrant.OptimizersConfigDiff{
		DeletedThreshold:      qdrant.PtrOf(0.2),
		VacuumMinVectorNumber: qdrant.PtrOf(uint64(1000)),
	},
})
```
