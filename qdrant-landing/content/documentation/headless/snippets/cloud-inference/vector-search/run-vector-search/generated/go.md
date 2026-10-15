```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

prefetch := []*qdrant.PrefetchQuery{
	{
		Query: &qdrant.Query{
			Variant: &qdrant.Query_Text{
				Text: &qdrant.TextQuery{Query: queryText},
			},
		},
		Using: qdrant.PtrOf("passage_text"),
	},
	{
		Query: qdrant.NewQueryDocument(&qdrant.Document{
			Text:  queryText,
			Model: denseModel,
		}),
		Using: qdrant.PtrOf("dense_vector"),
	},
}

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Prefetch:       prefetch,
	Query:          qdrant.NewQueryFusion(qdrant.Fusion_RRF),
	Limit:          qdrant.PtrOf(uint64(5)),
})
```
