```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant/serverless"
)

tenantID := "acme"

client.CreateCollection(context.Background(), "tenant-"+tenantID, &serverless.CollectionConfig{
	DenseVectors: serverless.NewDenseVectors(&serverless.DenseVectorConfig{
		Size:     384,
		Distance: serverless.Distance_COSINE,
	}),
})
```
