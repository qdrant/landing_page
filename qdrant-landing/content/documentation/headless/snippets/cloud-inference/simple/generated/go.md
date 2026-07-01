```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "<your-collection>",
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewIDNum(1),
			Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
				Text:  "Recipe for baking chocolate chip cookies",
				Model: "<the-model-to-use>",
			}),
			Payload: qdrant.NewValueMap(map[string]any{
				"topic": "cooking",
				"type":  "dessert",
			}),
		},
	},
})

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "<your-collection>",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Text:  "How to bake cookies?",
			Model: "<the-model-to-use>",
		}),
	),
})
```
