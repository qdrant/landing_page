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

	if err != nil {
		panic(err)
	}
	// @hide-end

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "{collection_name}",
		Query: qdrant.NewQueryText(&qdrant.TextQuery{Query: "time travel"}),
		Using: qdrant.PtrOf("title"),
		Filter: &qdrant.Filter{
			Must: []*qdrant.Condition{
				qdrant.NewMatch("group_id", "user_1"),
				qdrant.NewMatchInt("year", 2024),
			},
		},
		Params: &qdrant.SearchParams{
			Idf: &qdrant.IdfParams{
				Corpus: &qdrant.Filter{
					Must: []*qdrant.Condition{
						qdrant.NewMatch("group_id", "user_1"),
					},
				},
			},
		},
		Limit:       qdrant.PtrOf(uint64(10)),
		WithPayload: qdrant.NewWithPayload(true),
	})

}
