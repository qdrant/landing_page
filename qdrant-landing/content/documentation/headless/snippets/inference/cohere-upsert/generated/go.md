```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

ctx := qdrant.WithHeader(context.Background(), "cohere-api-key", "<YOUR_COHERE_API_KEY>")

client.Upsert(ctx, &qdrant.UpsertPoints{
	CollectionName: "{collection_name}",
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewIDNum(uint64(1)),
			Vectors: qdrant.NewVectorsImage(&qdrant.Image{
				Model: "cohere/embed-v4.0",
				Image: qdrant.NewValueString("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC"),
				Options: qdrant.NewValueMap(map[string]any{
					"output_dimension": 512,
				}),
			}),
		},
	},
})
```
