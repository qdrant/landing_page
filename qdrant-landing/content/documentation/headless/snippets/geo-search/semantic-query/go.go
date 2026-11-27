package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host:   "xyz-example.qdrant.io",
		Port:   6334,
		APIKey: "<your-api-key>",
		UseTLS: true,
	})
	if err != nil {
		panic(err)
	}
	defer client.Close()
	// @hide-end

	results, err := client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "venues",
		Query: qdrant.NewQueryDocument(&qdrant.Document{
			Text:  "quiet café to work from",
			Model: "sentence-transformers/all-minilm-l6-v2",
		}),
		Filter: &qdrant.Filter{
			Must: []*qdrant.Condition{
				qdrant.NewGeoRadius("location", 52.520711, 13.403683, 1500.0),
			},
		},
		Limit: qdrant.PtrOf(uint64(5)),
	})

	// @hide-start
	if err != nil {
		panic(err)
	}
	_ = results
	// @hide-end
}
