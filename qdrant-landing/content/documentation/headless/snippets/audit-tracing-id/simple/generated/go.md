```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

ctx := qdrant.WithHeader(context.Background(), "x-request-id", "my-trace-id")
client.ListCollections(ctx)
```
