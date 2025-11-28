```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.Delete(context.Background(), &qdrant.DeletePoints{
	CollectionName: "{collection_name}",
	Points: qdrant.NewPointsSelector(
		qdrant.NewIDNum(0), qdrant.NewIDNum(3), qdrant.NewIDNum(100),
	),
})
```
