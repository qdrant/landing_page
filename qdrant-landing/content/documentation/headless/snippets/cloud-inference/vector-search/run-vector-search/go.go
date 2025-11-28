package snippet

import "context" // @hide
import "github.com/qdrant/go-client/qdrant" // @hide

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})
	if err != nil { panic(err) }
	queryText := "{query_text}"
	denseModel := "{dense_model_name}"
	bm25Model := "{bm25_model_name}"
	// @hide-end

	prefetch := []*qdrant.PrefetchQuery{
		{
			Query: qdrant.NewQueryDocument(&qdrant.Document{
				Text:  queryText,
				Model: bm25Model,
			}),
			Using: qdrant.PtrOf("bm25_sparse_vector"),
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
