package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})

	if err != nil { panic(err) }
	// @hide-end

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "{collection_name}",
		Prefetch: []*qdrant.PrefetchQuery{
			{
				Query: &qdrant.Query{
					Variant: &qdrant.Query_Text{
						Text: &qdrant.TextQuery{Query: "vector database"},
					},
				},
				Using: qdrant.PtrOf("title"),
				Limit: qdrant.PtrOf(uint64(50)),
			},
			{
				Query: &qdrant.Query{
					Variant: &qdrant.Query_Text{
						Text: &qdrant.TextQuery{Query: "vector database"},
					},
				},
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
}
