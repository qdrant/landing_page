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
				Model: "openai/text-embedding-3-large",
				Text:  "Recipe for baking chocolate chip cookies",
				Options: qdrant.NewValueMap(map[string]any{
					"openai-api-key": "<YOUR_OPENAI_API_KEY>",
					"dimensions":     512,
				}),
			}),
		},
	},
})
```
