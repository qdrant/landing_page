```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "books",
	Query: &qdrant.Query{
		Variant: &qdrant.Query_Text{
			Text: &qdrant.TextQuery{
				Query: "time travel",
				Scoring: &qdrant.TextQuery_Bm25{
					Bm25: &qdrant.Bm25Params{
						K: qdrant.PtrOf(float32(1.5)),
						B: qdrant.PtrOf(float32(0.5)),
					},
				},
			},
		},
	},
	Using:       qdrant.PtrOf("title"),
	WithPayload: qdrant.NewWithPayload(true),
	Limit:       qdrant.PtrOf(uint64(10)),
})
```
