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
				// the sign of the first element is flipped
				Query: qdrant.NewQuery(-1.118, 0.3, 0.4),
				Limit: qdrant.PtrOf(uint64(100)),
			},
		},
		Query: qdrant.NewQueryFormula(&qdrant.Formula{
			Expression: qdrant.NewExpressionNeg(
				qdrant.NewExpressionAcosh(
					qdrant.NewExpressionNeg(qdrant.NewExpressionVariable("$score")),
				),
			),
		}),
	})
}
