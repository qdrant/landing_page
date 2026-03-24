```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "{collection_name}",
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewIDNum(uint64(1)),
			Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
				Model: "openrouter/mistralai/mistral-embed-2312",
				Text:  "Recipe for baking chocolate chip cookies",
				Options: qdrant.NewValueMap(map[string]any{
					"openrouter-api-key": "<YOUR_OPENROUTER_API_KEY>",
				}),
			}),
		},
	},
})
```
