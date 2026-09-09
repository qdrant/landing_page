```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	// ... other collection parameters
	ShardNumber:    qdrant.PtrOf(uint32(1)),
	ShardingMethod: qdrant.ShardingMethod_Custom.Enum(),
})
```
