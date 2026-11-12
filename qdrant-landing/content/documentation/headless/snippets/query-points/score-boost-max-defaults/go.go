package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})

	if err != nil { panic(err) } // @hide

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "{collection_name}",
		Prefetch: []*qdrant.PrefetchQuery{
			{
				Query: qdrant.NewQuery(0.01, 0.45, 0.67),
				Using: qdrant.PtrOf("title"),
				Limit: qdrant.PtrOf(uint64(50)),
			},
			{
				Query: qdrant.NewQuery(0.01, 0.45, 0.67),
				Using: qdrant.PtrOf("summary"),
				Limit: qdrant.PtrOf(uint64(50)),
			},
		},
		Query: qdrant.NewQueryFormula(&qdrant.Formula{
			Expression: qdrant.NewExpressionMax(&qdrant.MaxExpression{
				Max: []*qdrant.Expression{
					qdrant.NewExpressionVariable("$score[0]"),
					qdrant.NewExpressionVariable("$score[1]"),
				},
			}),
			// used when a point is missing from the second prefetch
			Defaults: qdrant.NewValueMap(map[string]any{
				"$score[1]": -1e30,
			}),
		}),
	})
}
