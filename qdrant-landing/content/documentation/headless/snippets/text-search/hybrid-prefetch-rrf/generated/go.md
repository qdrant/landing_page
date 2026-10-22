```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "books",
	Prefetch: []*qdrant.PrefetchQuery{
		{
			Using: qdrant.PtrOf("description-dense"),
			Query: qdrant.NewQueryDocument(&qdrant.Document{
				Text:  "time travel",
				Model: "sentence-transformers/all-minilm-l6-v2",
			}),
			ScoreThreshold: qdrant.PtrOf(float32(0.5)),
		},
		{
			Using: qdrant.PtrOf("title"),
			Query: &qdrant.Query{
				Variant: &qdrant.Query_Text{
					Text: &qdrant.TextQuery{Query: "time travel"},
				},
			},
		},
	},
	Query:       qdrant.NewQueryFusion(qdrant.Fusion_RRF),
	WithPayload: qdrant.NewWithPayload(true),
	Limit:       qdrant.PtrOf(uint64(10)),
})
```
