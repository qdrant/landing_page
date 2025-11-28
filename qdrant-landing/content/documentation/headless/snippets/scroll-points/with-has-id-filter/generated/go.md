```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.Scroll(context.Background(), &qdrant.ScrollPoints{
	CollectionName: "{collection_name}",
	Filter: &qdrant.Filter{
		Must: []*qdrant.Condition{
			qdrant.NewHasID(
				qdrant.NewIDNum(1),
				qdrant.NewIDNum(3),
				qdrant.NewIDNum(5),
				qdrant.NewIDNum(7),
				qdrant.NewIDNum(9),
				qdrant.NewIDNum(11),
			),
		},
	},
})
```
