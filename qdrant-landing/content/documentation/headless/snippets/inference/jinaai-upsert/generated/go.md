```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

ctx := qdrant.WithHeader(context.Background(), "jina-api-key", "<YOUR_JINAAI_API_KEY>")

client.Upsert(ctx, &qdrant.UpsertPoints{
	CollectionName: "{collection_name}",
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewIDNum(uint64(1)),
			Vectors: qdrant.NewVectorsImage(&qdrant.Image{
				Model: "jinaai/jina-clip-v2",
				Image: qdrant.NewValueString("https://qdrant.tech/example.png"),
				Options: qdrant.NewValueMap(map[string]any{
					"dimensions": 512,
				}),
			}),
		},
	},
})
```
