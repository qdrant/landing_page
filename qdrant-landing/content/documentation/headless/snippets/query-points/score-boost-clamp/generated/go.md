```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host: "localhost",
	Port: 6334,
})

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Prefetch: []*qdrant.PrefetchQuery{
		{
			Query: qdrant.NewQuery(0.01, 0.45, 0.67),
		},
	},
	Query: qdrant.NewQueryFormula(&qdrant.Formula{
		Expression: qdrant.NewExpressionSum(&qdrant.SumExpression{
			Sum: []*qdrant.Expression{
				qdrant.NewExpressionVariable("$score"),
				// clamp `rating` into the range [0, 1]
				qdrant.NewExpressionMax(&qdrant.MaxExpression{
					Max: []*qdrant.Expression{
						qdrant.NewExpressionConstant(0.0),
						qdrant.NewExpressionMin(&qdrant.MinExpression{
							Min: []*qdrant.Expression{
								qdrant.NewExpressionConstant(1.0),
								qdrant.NewExpressionVariable("rating"),
							},
						}),
					},
				}),
			},
		}),
	}),
})
```
