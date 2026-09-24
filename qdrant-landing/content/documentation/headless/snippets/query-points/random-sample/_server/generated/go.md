```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.QueryGroups(context.Background(), &qdrant.QueryPointGroups{
	CollectionName: "{collection_name}",
	Query:          qdrant.NewQuerySample(qdrant.Sample_Random),
})
```
