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
				Query: qdrant.NewQueryNearest(
					qdrant.NewVectorInputDocument(&qdrant.Document{
						Text:  "vector database",
						Model: "qdrant/bm25",
					}),
				),
				Using: qdrant.PtrOf("title-bm25"),
				Limit: qdrant.PtrOf(uint64(50)),
			},
			{
				Query: qdrant.NewQueryNearest(
					qdrant.NewVectorInputDocument(&qdrant.Document{
						Text:  "vector database",
						Model: "qdrant/bm25",
					}),
				),
				Using: qdrant.PtrOf("body-bm25"),
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
}
