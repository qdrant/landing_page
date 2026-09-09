package snippet

// @hide-start
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

// @hide-end
func Main() {
	//@hide-start
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
		Query: qdrant.NewQueryNearest(
			qdrant.NewVectorInputDocument(&qdrant.Document{
				Model: "qdrant/bm25",
				Text:  "time travel",
			}),
		),
		Using: qdrant.PtrOf("title-bm25"),
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
