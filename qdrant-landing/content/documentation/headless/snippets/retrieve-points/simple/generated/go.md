```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.Get(context.Background(), &qdrant.GetPoints{
	CollectionName: "{collection_name}",
	Ids: []*qdrant.PointId{
		qdrant.NewIDNum(0), qdrant.NewIDNum(3), qdrant.NewIDNum(100),
	},
})
```
