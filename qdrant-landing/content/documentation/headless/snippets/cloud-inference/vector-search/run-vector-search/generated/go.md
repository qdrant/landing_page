```go
import (
	"context"
	"fmt"
	"strings"

	"github.com/qdrant/go-client/qdrant"
)

prefetch := []*qdrant.PrefetchQuery{
	{
		Query: qdrant.NewQueryText(&qdrant.TextQuery{Query: queryText}),
		Using: qdrant.PtrOf("passage_text"),
		Limit: qdrant.PtrOf(uint64(5)),
	},
	{
		Query: qdrant.NewQueryDocument(&qdrant.Document{
			Text:  queryText,
			Model: denseModel,
		}),
		Using: qdrant.PtrOf("dense_vector"),
		Limit: qdrant.PtrOf(uint64(5)),
	},
}

results, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Prefetch:       prefetch,
	Query:          qdrant.NewQueryFusion(qdrant.Fusion_RRF),
	Limit:          qdrant.PtrOf(uint64(5)),
	WithPayload:    qdrant.NewWithPayload(true),
})
if err != nil {
	panic(err)
}

for _, point := range results {
	question := point.Payload["question"].GetStringValue()
	fmt.Printf("%.3f  %s\n", point.Score, strings.TrimSpace(question))
}
```
