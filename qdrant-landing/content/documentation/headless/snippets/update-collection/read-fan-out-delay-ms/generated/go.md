```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
	CollectionName: "{collection_name}",
	Params: &qdrant.CollectionParamsDiff{
		ReadFanOutDelayMs: qdrant.PtrOf(uint64(100)),
	},
})
```
