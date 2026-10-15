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
	queryText := "{query_text}"
	denseModel := "{dense_model_name}"
	// @hide-end

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
	})
}
