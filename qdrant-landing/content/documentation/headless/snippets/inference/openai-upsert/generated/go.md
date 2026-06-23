```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

ctx := qdrant.WithHeader(context.Background(), "openai-api-key", "<YOUR_OPENAI_API_KEY>")

client.Upsert(ctx, &qdrant.UpsertPoints{
	CollectionName: "{collection_name}",
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewIDNum(uint64(1)),
			Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
				Model: "openai/text-embedding-3-large",
				Text:  "Recipe for baking chocolate chip cookies",
				Options: qdrant.NewValueMap(map[string]any{
					"dimensions": 512,
				}),
			}),
		},
	},
})
```
