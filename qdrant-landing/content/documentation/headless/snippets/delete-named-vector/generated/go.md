```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.DeleteVectorName(context.Background(), &qdrant.DeleteVectorNameRequest{
	CollectionName: "{collection_name}",
	VectorName:     "{vector_name}",
})
```
