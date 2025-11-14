```go
import (
	"context"
	"time"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
    Host:   "xyz-example.qdrant.io",
    Port:   6334,
    APIKey: "<paste-your-api-key-here>",
    UseTLS: true,
})

client.Upsert(ctx, &qdrant.UpsertPoints{
	CollectionName: "<your-collection>",
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewIDNum(uint64(1)),
			Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
				"my-bm25-vector": qdrant.NewVectorDocument(&qdrant.Document{
					Model: "qdrant/bm25",
					Text:  "Recipe for baking chocolate chip cookies",
				}),
			}),
		},
	},
})
```