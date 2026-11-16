```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Prefetch: []*qdrant.PrefetchQuery{
		{
			Query: qdrant.NewQueryText(&qdrant.TextQuery{Query: "vector database"}),
			Using: qdrant.PtrOf("title"),
			Limit: qdrant.PtrOf(uint64(50)),
		},
		{
			Query: qdrant.NewQueryText(&qdrant.TextQuery{Query: "vector database"}),
			Using: qdrant.PtrOf("body"),
			Limit: qdrant.PtrOf(uint64(50)),
		},
	},
	Query: qdrant.NewQueryFormula(&qdrant.Formula{
		Expression: qdrant.NewExpressionMax(&qdrant.MaxExpression{
			Max: []*qdrant.Expression{
				// boost title matches
				qdrant.NewExpressionMult(&qdrant.MultExpression{
					Mult: []*qdrant.Expression{
						qdrant.NewExpressionConstant(3.0),
						qdrant.NewExpressionVariable("$score[0]"),
					},
				}),
				qdrant.NewExpressionVariable("$score[1]"),
			},
		}),
	}),
})
```
