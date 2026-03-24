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
			Vectors: qdrant.NewVectorsImage(&qdrant.Image{
				Model: "jinaai/jina-clip-v2",
				Image: qdrant.NewValueString("https://qdrant.tech/example.png"),
				Options: qdrant.NewValueMap(map[string]any{
					"jina-api-key": "<YOUR_JINAAI_API_KEY>",
					"dimensions":   512,
				}),
			}),
		},
	},
})
```
