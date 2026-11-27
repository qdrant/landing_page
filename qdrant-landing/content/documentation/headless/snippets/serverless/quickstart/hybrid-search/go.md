```go
import (
	"context"
	"fmt"

	"github.com/qdrant/go-client/qdrant"
)

query := "a vegetarian dish with tahini"

results, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "menu",
	Prefetch: []*qdrant.PrefetchQuery{
		{
			Query: qdrant.NewQueryDocument(&qdrant.Document{Text: query, Model: model}),
			Using: qdrant.PtrOf("dense"),
			Limit: qdrant.PtrOf(uint64(10)),
		},
		{
			Query: qdrant.NewQueryText(&qdrant.TextQuery{Query: query}),
			Using: qdrant.PtrOf("description"),
			Limit: qdrant.PtrOf(uint64(10)),
		},
	},
	Query:       qdrant.NewQueryFusion(qdrant.Fusion_RRF),
	Limit:       qdrant.PtrOf(uint64(3)),
	WithPayload: qdrant.NewWithPayload(true),
})
if err != nil {
	panic(err)
}

for _, hit := range results {
	fmt.Println(hit.Payload["name"].GetStringValue(), hit.Score)
}
```
