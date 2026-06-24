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
			Vectors: qdrant.NewVectorsImage(&qdrant.Image{
				Model: "qdrant/clip-vit-b-32-vision",
				Image: qdrant.NewValueString("https://qdrant.tech/example.png"),
			}),
			Payload: qdrant.NewValueMap(map[string]any{
				"title": "Example image",
			}),
		},
	},
})

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "<your-collection>",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Text:  "Mission to Mars",
			Model: "qdrant/clip-vit-b-32-text",
		}),
	),
})
```
