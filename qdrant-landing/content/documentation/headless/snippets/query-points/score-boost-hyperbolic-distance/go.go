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
				// the time coordinate (the first value) is negated
				Query: qdrant.NewQuery(-3.2, 0.3, 0.4),
				Limit: qdrant.PtrOf(uint64(100)),
			},
		},
		Query: qdrant.NewQueryFormula(&qdrant.Formula{
			Expression: qdrant.NewExpressionMult(&qdrant.MultExpression{
				Mult: []*qdrant.Expression{
					qdrant.NewExpressionConstant(-3.1622776601683795), // -1 / sqrt(0.1)
					qdrant.NewExpressionAcosh(
						qdrant.NewExpressionMult(&qdrant.MultExpression{
							Mult: []*qdrant.Expression{
								qdrant.NewExpressionConstant(0.1),
								qdrant.NewExpressionNeg(qdrant.NewExpressionVariable("$score")),
							},
						}),
					),
				},
			}),
		}),
	})
}
