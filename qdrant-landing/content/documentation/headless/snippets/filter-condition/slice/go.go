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

	client.Scroll(context.Background(), &qdrant.ScrollPoints{
		CollectionName: "{collection_name}",
		Filter: &qdrant.Filter{
			Must: []*qdrant.Condition{
				qdrant.NewSlice(
	        3, 8,
				),
			},
		},
	})
}
